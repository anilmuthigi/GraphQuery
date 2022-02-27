const axios=require('axios');
const ethers = require('ethers');
const { MultiCall }= require('@indexed-finance/multicall');
const dotenv = require('dotenv').config();

const alchemy_key=`https://eth-mainnet.alchemyapi.io/v2/${process.env.Alchemy_Key}`;
let provider = new ethers.providers.JsonRpcProvider(alchemy_key);

const Contractabi = require("./contractabi.json");

const main=async()=> {

    //stores the dsa accounts
     let dsa_accounts = new Map();

     //maps dsa accounts' owner to the dsa account
     let dsa_accounts_map = new Map();


    //variable used for pagenation.. stores the last fetched id inorder to get the next page in the next iteration of the while loop
    var pagenation_variable=``;


    //code to get dsa accounts and the owner of the dsa account by tracking the logAccountCreateds event in the InstaIndex Contract

     while(1)
     {
        const result = await axios.post(
        'https://api.thegraph.com/subgraphs/name/anilmuthigi/dsa-accounts',
        {
            query : `
            {
                logAccountCreateds(first: 1000, where: {id_gt:"`+pagenation_variable+`"}){
                    id
                    sender
                    owner
                    account
                  }
            }
            `
            
        }
        
        );

        //break out of the loop if the object returns an array with length = 0... since this page has no elements, no need to check for further pages
        if(Object.values(result.data.data.logAccountCreateds).length===0)break;

        // stores the object returned into an array.. in order to traverse the results
        accounts_created=Object.values(result.data.data.logAccountCreateds);


        /*
        loop through the returned results in order to: 
        1. Fill in the map containing the dsa accounts 
        2. To map the dsa account owner to the dsa account
        */

        for (var i = 0; i < accounts_created.length; i++)
        {
            dsa_accounts.set(accounts_created[i].account,1);
            dsa_accounts_map.set(accounts_created[i].owner,accounts_created[i].account);
               
        }


        //stores the last id out of the 1000 entries returned inorder to find the next 1000 results in the next iteration of the while loop
        pagenation_variable=result.data.data.logAccountCreateds[Object.values(result.data.data.logAccountCreateds).length-1].id;
    }
    
    //prints the number of dsa accounts
    console.log("Number of dsa's = ", dsa_accounts.size);


    //stores a list of unique tokenids owned by our dsa
    let dsa_tokenids = new Set();

    //maps every token to the dsa account which owns it
    let token_dsa_map = new Map();


    //resetting the pagenation id to null.. to be reused in the next api request
    pagenation_variable=``;


    //tracks all the nft transfers... nft with 'tokenid' is being transfered 'from' -> 'to'
    while(1)
    {

        const result = await axios.post(
            'https://api.thegraph.com/subgraphs/name/anilmuthigi/nftidtransfers',
            {
                query: `
                {
                    transfers(first: 1000, where: {id_gt:"`+pagenation_variable+`"}){
                        id
                        from
                        to
                        tokenId
                    }
                }
                `
            }
        
        );  

        //break out of the loop if the object returns an array with length = 0... since this page has no elements, no need to check for further pages
        if(Object.values(result.data.data.transfers).length===0)break;
    
        // stores the object returned into an array.. in order to traverse the results
        nft_transfers=Object.values(result.data.data.transfers);



        for (var i = 0; i < nft_transfers.length; i++)
        {
            //updates the set dsa_tokenids which stores a list of unique tokenids owned by our dsa
       
            /*
            1. If both 'from' and 'to' are dsa accounts... no need to remove the token id from the list of tokeid's owned by our dsa's
            2. If only the 'to' account is a dsa account... add the tokenid in the list of tokenid's owned by our dsa's
            3. If only the 'from' account is a dsa account... remove the tokenid from the list of tokenid's owned by our dsa's
            */

            if(dsa_accounts.has(nft_transfers[i].to) && dsa_accounts.has(nft_transfers[i].from))
            {
                ;
            }
            else if(dsa_accounts.has(nft_transfers[i].to))
            {
                dsa_tokenids.add(nft_transfers[i].tokenId);
            }
            else if(dsa_accounts.has(nft_transfers[i].from))
            {
                dsa_tokenids.delete(nft_transfers[i].tokenId);
            }



            //if the 'from' account is a dsa-account, we erase the mapping of the tokenid 

            if(dsa_accounts.has(nft_transfers[i].from) && !(dsa_accounts.has(nft_transfers[i].to)))
            {
                token_dsa_map.delete(nft_transfers[i].tokenId);
            }

            //if the to account is a dsa-account we map the tokenid to the address of the 'to' account
            if(dsa_accounts.has(nft_transfers[i].to))
            {
                token_dsa_map.set(nft_transfers[i].tokenId,nft_transfers[i].to);
            
            }

       

        }


        // used for pagenation
        pagenation_variable = result.data.data.transfers[Object.values(result.data.data.transfers).length-1].id;

    }

    //prints the number of tokens
    console.log("Number of tokens owned by our dsa's = ", dsa_tokenids.size);


    // token_dsa_map maps the token and the dsa account which owns it
    console.log("Tokens and their owners = ");
    console.log(token_dsa_map);


    //now.. to get the total amount in usd of all the tokens owned by our dsa's we define a getPrecision function which returns the precision of a particular token
    async function getPrecision(token_address_input){
        var api_address="https://api.instadapp.io/defi/tokens/details?owner=0x388e72eaf4689a7a698360b8e86bf71326107d7d&tokens%5B0%5D=";

        var precision = await axios.get(
            (api_address+token_address_input)
          );
        
        // The following code extracts only the decimal precision part from the given api and returns it
        let outputs = Object.entries(precision.data);
        let dt1=Object.entries(new Map(outputs).values().next().value);
        let map3=new Map(dt1);
        return map3.get('decimals');

    }



    // this creates a map which maps token addresses to the conversion rate: to usd, including all the additional tokens
    const tokenPrices = await axios.get(
        "https://api.instadapp.io/defi/prices?additionalTokens=0x090185f2135308BaD17527004364eBcC2D37e5F6,0x92D6C1e31e14520e676a687F0a93788B716BEff5,0xf21661D0D1d76d3ECb8e1B9F1c923DBfffAe4097,0xba5BDe662c17e2aDFF1075610382B9B691296350,0xe1406825186D63980fd6e2eC61888f7B91C4bAe4,0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39,0xBB0E17EF65F82Ab018d8EDd776e8DD940327B28b,0x6BF4B73d2C3E806B41FeB83665Ef46A8A65F01B1,0x990f341946A3fdB507aE7e52d17851B87168017c,0xf66Cd2f8755a21d3c8683a10269F795c0532Dd58,0x90DE74265a416e1393A450752175AED98fe11517,0xAa6E8127831c9DE45ae56bB1b0d4D4Da6e5665BD,0xF9A2D7E60a3297E513317AD1d7Ce101CC4C6C8F6,0x2d94AA3e47d9D5024503Ca8491fcE9A2fB4DA198,0x3b484b82567a09e2588A13D54D032153f0c0aEe0,0xfcfC434ee5BfF924222e084a8876Eee74Ea7cfbA,0xbC396689893D065F41bc2C6EcbeE5e0085233447,0xB4EFd85c19999D84251304bDA99E90B92300Bd93,0xcAfE001067cDEF266AfB7Eb5A286dCFD277f3dE5,0xf4d2888d29D722226FafA5d9B24F9164c092421E"
     );
    
    let newArray = Object.entries(tokenPrices.data);
    let map1 = new Map(newArray);


    //stores unfound token addresses... the token addresses which were not present in the above api
    let unfound_tokenaddr= new Set();

    //stores total amount in USD which our tokens sum up to
    var total_usd=0.0;




    //storing the tokenid's in an array.. i.e an iterable format... done for convenience and printing purposes
    const tokenid_array = [];
    var token_array_index=0;// index to be used to traverse the 'tokenid_array' array later
    for(const elem of dsa_tokenids)
    {
        tokenid_array.push(elem);
    }

    //variable initialized to traverse the 'tokenid_array' array
    var tokenids_visited=0;



    //intiialize the multicall constructor... we will be using this later
    const multi = new MultiCall(provider);

    while(tokenids_visited<dsa_tokenids.size)
    {

        // we will be calling the api to fetch token information using the function getPositionInfoByTokenId using multicall.... in batches of 15....
        // we use multicall here to avoid multiple api calls to save time and to prevent exceeding rate limit

        //this array stores multple calls to the getPositionInfoByTokenId function to get token details
        const inputs=[];
        for(var range=0;range<15;range++)
        {

            inputs.push({ target:`0x9156cD73ba5F792E26e9a1762DfC05162d9408c5`,function:'getPositionInfoByTokenId',args:[tokenid_array[tokenids_visited]] });
            tokenids_visited++;

            //If we have already visited all tokens... no need to add more tokens to the multicall input array
            if(tokenids_visited==dsa_tokenids.size)break;
        }


        //get the token data of the 15 tokens
        const tokendata = await multi.multiCall(Contractabi,inputs);


        for(var i=0;i<inputs.length;i++)
        {
            //gets address of token0
            address_token0=tokendata[1][i][0];


            //amount0_usd will store the value of amount0 in usd.... 
            let amount0_usd=tokendata[1][i][10]* Math.pow(10,-1*parseInt(await getPrecision(address_token0)));


            //if both addresses of token are present the value of the tokens get added(since the pool is valid) else if any of the token address is not found, we ignore both tokens' usd value
            //for now, lets assume that the pool is valid, if any token is not found, we can reset its value
            let valid_pool_checker=1;

            //map1 is a map which maps token addresses to the conversion rate: in usd
            if(map1.get(tokendata[1][i][0])==undefined)
            {
                console.log();
                console.log("Token0 address not found in api: ",tokendata[1][i][0]);
                unfound_tokenaddr.add(tokendata[1][i][0]);
                console.log();

                //no contribution of tokens which were not found in the api
                amount0_usd=0.0;

                //pool becomes invalid
                valid_pool_checker=0;
            }
            else
            {
                //map1 is a map which maps token addresses to the conversion rate: in usd
                //multiplying the token amount with its conversion rate
                amount0_usd=amount0_usd*map1.get(tokendata[1][i][0]);
            }
            

            //gets address of token1
            address_token1=tokendata[1][i][1];

            //amount1_usd has the value of amount1 in usd.... 
            let amount1_usd=tokendata[1][i][11]*Math.pow(10,-1*parseInt(await getPrecision(address_token1)));

            //map1 is a map which maps token addresses to the conversion rate: in usd
            if(map1.get(tokendata[1][i][1])==undefined)
            {
                console.log();
                console.log("Token1 address not found in api: ",tokendata[1][i][1]);
                unfound_tokenaddr.add(tokendata[1][i][1]);
                console.log();

                //no contribution of tokens which were not found in the api
                amount1_usd=0.0;

                //pool becomes invalid
                valid_pool_checker=0;
            }
            else 
            {
                //map1 is a map which maps token addresses to the conversion rate: in usd
                //multiplying the token amount with its conversion rate
                amount1_usd=amount1_usd*map1.get(tokendata[1][i][1]);
            }
            
            //add the amount0 and amount1 values to the total_usd variable if the pool is valid
            if(valid_pool_checker==1)
            {
                total_usd+=amount0_usd+amount1_usd;
                console.log("Nft id: ",tokenid_array[token_array_index++],"  Amount0 in usd: ",amount0_usd,"  Amount1 in usd: ",amount1_usd);
            }
            else 
            {
                console.log("Invalid pool with Nft id: ",tokenid_array[token_array_index++]);
            }
        
        }

    }

    console.log("Total Amount in usd = ",total_usd);
    console.log();
    console.log("Tokens which were not found in the api.. hence their amounts were ignored :");
    console.log(unfound_tokenaddr);


}
main();
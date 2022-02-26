const axios=require('axios');
const ethers = require('ethers');
const { MultiCall }= require('@indexed-finance/multicall');

const dotenv = require('dotenv').config();

const alchemy_key=`https://eth-mainnet.alchemyapi.io/v2/${process.env.Alchemy_Key}`;

const NewAbi = require("./abi.json");
const address_uniswap="0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
let provider = new ethers.providers.JsonRpcProvider(alchemy_key);
let contract = new ethers.Contract(address_uniswap, NewAbi, provider);

const NewAbi1 = require("./abi1.json");
const address_erc="0xB2D6fb1Dc231F97F8cC89467B52F7C4F78484044";
let contract1 = new ethers.Contract(address_erc, NewAbi1, provider);


const Contractabi = require("./contractabi.json");

const NewAbi2 = require("./abi2.json");
const address_ver="0x2971AdFa57b20E5a416aE5a708A8655A9c74f723";
let contract2 = new ethers.Contract(address_ver, NewAbi2, provider);

const main=async()=> {
    var tr=``;
     var result;
     //var ctr=1;

    //console.log(contract2);


    // this creates a map which maps token addresses to the conversion rate - to usd
    const tokenPrices = await axios.get(
        "https://api.instadapp.io/defi/prices?additionalTokens=0x090185f2135308BaD17527004364eBcC2D37e5F6,0x92D6C1e31e14520e676a687F0a93788B716BEff5,0xf21661D0D1d76d3ECb8e1B9F1c923DBfffAe4097,0xba5BDe662c17e2aDFF1075610382B9B691296350,0xe1406825186D63980fd6e2eC61888f7B91C4bAe4,0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39,0xBB0E17EF65F82Ab018d8EDd776e8DD940327B28b,0x6BF4B73d2C3E806B41FeB83665Ef46A8A65F01B1,0x990f341946A3fdB507aE7e52d17851B87168017c,0xf66Cd2f8755a21d3c8683a10269F795c0532Dd58,0x90DE74265a416e1393A450752175AED98fe11517,0xAa6E8127831c9DE45ae56bB1b0d4D4Da6e5665BD,0xF9A2D7E60a3297E513317AD1d7Ce101CC4C6C8F6,0x2d94AA3e47d9D5024503Ca8491fcE9A2fB4DA198,0x3b484b82567a09e2588A13D54D032153f0c0aEe0,0xfcfC434ee5BfF924222e084a8876Eee74Ea7cfbA,0xbC396689893D065F41bc2C6EcbeE5e0085233447,0xB4EFd85c19999D84251304bDA99E90B92300Bd93,0xcAfE001067cDEF266AfB7Eb5A286dCFD277f3dE5,0xf4d2888d29D722226FafA5d9B24F9164c092421E"
     );
      //console.log(typeof(tokenPrices));

      let newArray = Object.entries(tokenPrices.data);
    
    let map1 = new Map(newArray);
    //console.log(parseInt(map1.get('0x8878Df9E1A7c87dcBf6d3999D997f262C05D8C70')));




   


    const multi = new MultiCall(provider);
    //stores the dsa accounts
     let dsa_accounts = new Map();

     //maps dsa accounts' owner to the dsa
     let dsa_accounts_map = new Map();

    //code to get dsa accounts
     while(1)
     {
        result = await axios.post(
        'https://api.thegraph.com/subgraphs/name/anilmuthigi/dsa-accounts',
        {
            query : `
            {
                logAccountCreateds(first: 1000, where: {id_gt:"`+tr+`"}){
                    id
                    sender
                    owner
                    account
                  }
            }
            `
            
        }
        
        );

        if(Object.values(result.data.data.logAccountCreateds).length===0)break;
        datas=Object.values(result.data.data.logAccountCreateds);
        for (var i = 0; i < datas.length; i++)
        {
            dsa_accounts.set(datas[i].account,2);
            dsa_accounts_map.set(datas[i].owner,datas[i].account);
               
        }

        
        tr=result.data.data.logAccountCreateds[Object.values(result.data.data.logAccountCreateds).length-1].id;
    }
    
    //prints the number of dsa
    console.log(dsa_accounts.size);

//     //stores the data for build function call
//     var resultversion;
//     var cnt=0;
//     tr=``;
//     while(1)
//     {
//        resultversion = await axios.post(
//        'https://api.thegraph.com/subgraphs/name/anilmuthigi/accountversion',
//        {
//            query : `
//            {
//                 builds(first: 1000, where: {id_gt:"`+tr+`"}){
//                     id
//                     owner
//                     accountVersion
//                     origin
//                  }
//            }
//            `
           
//        }
       
//        );



//        if(Object.values(resultversion.data.data.builds).length===0)break;
//        dataversion=Object.values(resultversion.data.data.builds);
//        for (var i = 0; i < dataversion.length; i++)
//        {
//            //console.log(dataversion[i].owner.toString());
//            if(dsa_accounts_map.has(dataversion[i].owner.toString()))
//            {
//                 if(parseInt(dataversion[i].accountVersion)==1)
//                 {
//                     //dataversion[i].owner gets the the owner of the dsa, dsa_accounts_map map the address of the owner of dsa to the address of dsa
//                     dsa_accounts.set(dsa_accounts_map.get(dataversion[i].owner),parseInt(dataversion[i].accountVersion));
//                     cnt++;
//                 }        
//            }      
//        }    
//        //done for pagenation
//        tr=resultversion.data.data.builds[Object.values(resultversion.data.data.builds).length-1].id;
//    }
//    console.log(cnt);

// console.log(dsa_accounts.size);
    

    //stores a list of unique tokenids owned by our dsa
    let tokenidset = new Set();
    

    //stores unfound token addresses
    let unfoundt= new Set();


    //maps every token to the dsa account which owns it
    let usertokenmap = new Map();

    tr=``;
//tracks all the nft transfers
    while(1)
    {


    const result1 = await axios.post(
        'https://api.thegraph.com/subgraphs/name/anilmuthigi/nftidtransfers',
        {
            query: `
            {
                transfers(first: 1000, where: {id_gt:"`+tr+`"}){
                    id
                    from
                    to
                    tokenId
                }
            }
            `
        }
        
        );  

    if(Object.values(result1.data.data.transfers).length===0)break;
    
    datas1=Object.values(result1.data.data.transfers);

    for (var i = 0; i < datas1.length; i++)
    {
        //updates the set tokenidset which stores a list of unique tokenids owned by our dsa

       
        if(dsa_accounts.has(datas1[i].to) && dsa_accounts.has(datas1[i].from))
        {
            ;
        }
        else if(dsa_accounts.has(datas1[i].to))
        {
            //console.log(datas1[i].tokenId);
            tokenidset.add(datas1[i].tokenId);
        }
        else if(dsa_accounts.has(datas1[i].from))
        {
            tokenidset.delete(datas1[i].tokenId);
        }
        //if the from account is a dsa-account, we erase the mapping of the tokenid 

        if(dsa_accounts.has(datas1[i].from) && !(dsa_accounts.has(datas1[i].to)))
        {
            usertokenmap.delete(datas1[i].tokenId);
        }

        //if the to account is a dsa-account we map the tokenid to the address of the to account
        if(dsa_accounts.has(datas1[i].to))
        {
            usertokenmap.set(datas1[i].tokenId,datas1[i].to);
            
        }

       

    }
    // used for pagenation

    tr = result1.data.data.transfers[Object.values(result1.data.data.transfers).length-1].id;

    }

    //prints the number of tokens
    console.log(tokenidset.size);

    
    console.log(usertokenmap.size);
    // maps the token and the dsa account which owns it
    console.log(usertokenmap);

    //some variables to call the decimal precision api...gives the decimal precision of a token address
    var d1='0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    var same="https://api.instadapp.io/defi/tokens/details?owner=0x388e72eaf4689a7a698360b8e86bf71326107d7d&tokens%5B0%5D=";
    
    // var precision = await axios.get(
    //     (same+d1)
    //   );
    // let outputs = Object.entries(precision.data);
    // let dt1=Object.entries(new Map(outputs).values().next().value);
    // let map3=new Map(dt1);
    // console.log(map3.get('decimals'));


    const inputs1 = [];
    for(const elem of tokenidset)
    {
        inputs1.push(elem);
    }

    var tot=0;
   
    var vb=0;
    while(tot<tokenidset.size)
    {
        const inputs=[];
        for(var cbt=0;cbt<30;cbt++)
    {

        inputs.push({ target:`0x9156cD73ba5F792E26e9a1762DfC05162d9408c5`,function:'getPositionInfoByTokenId',args:[inputs1[tot]] });
        cbt++;
        tot++;
        if(tot==tokenidset.size)break;
    }



    var total_usd=0.0;
    const tokendata = await multi.multiCall(Contractabi,inputs);
   for(var i=0;i<inputs.length;i++)
   {
    d1=tokendata[1][i][0];

    var precision = await axios.get(
        (same+d1)
      );
    let outputs = Object.entries(precision.data);
    let dt1=Object.entries(new Map(outputs).values().next().value);
    let map3=new Map(dt1);
    //pr1 has the value of amount0 in usd.... 
    let pr1=tokendata[1][i][10]* Math.pow(10,-1*parseInt(map3.get('decimals')));
    if(map1.get(tokendata[1][i][0])==undefined)
    {
        console.log();
        console.log(tokendata[1][i][0]);
        unfoundt.add(tokendata[1][i][0]);
        console.log();
        pr1=0.0;
    }
    else
    pr1=pr1*map1.get(tokendata[1][i][0]);





    d1=tokendata[1][i][1];

     precision = await axios.get(
        (same+d1)
      );
     outputs = Object.entries(precision.data);
     dt1=Object.entries(new Map(outputs).values().next().value);
     map3=new Map(dt1);
 //pr2 has the value of amount0 in usd.... 
    let pr2=tokendata[1][i][11]*Math.pow(10,-1*parseInt(map3.get('decimals')));

    if(map1.get(tokendata[1][i][1])==undefined)
    {
        console.log();
        console.log(tokendata[1][i][1]);
        unfoundt.add(tokendata[1][i][1]);
        console.log();
        pr2=0.0;
    }
    else 
    pr2=pr2*map1.get(tokendata[1][i][1]);

    total_usd+=pr1+pr2;

    console.log(inputs1[vb++],pr1,pr2);


   }

    }

    console.log("Total Amount in usd = ",total_usd);
    console.log(unfoundt);



//     //maps tokenid to liquidity
//     let liq = new Map();
// tr=``;

// while(1)
// {
//     const result2 = await axios.post(
//         'https://api.thegraph.com/subgraphs/name/anilmuthigi/liquidityevents',
//         {
//             query: `
//             {
//                 increaseLiquidities(first: 1000, where: {id_gt:"`+tr+`"}) {
//                     id
//                     tokenId
//                     liquidity
//                     amount0
//                     amount1
//                     }
//             }
//             `
//         }
        
//         );

//     if(Object.values(result2.data.data.increaseLiquidities).length===0)break;
//     datas2=Object.values(result2.data.data.increaseLiquidities);

//     //code to increase liquidty of tokens owned by dsa-accounts
//     for(var i=0;i<datas2.length;i++)
//     {
//         //console.log(datas2[i].tokenId.toString(), tokenidset.has(datas2[i].tokenId));
//         if(tokenidset.has(datas2[i].tokenId.toString()))
//         {
//             //console.log(1);
//             if(liq.get(datas2[i].tokenId)===undefined)
//                 liq.set(datas2[i].tokenId,parseInt(datas2[i].liquidity));
//             else
//                 liq.set(datas2[i].tokenId,liq.get(datas2[i].tokenId)+parseInt(datas2[i].liquidity));
//         }
//     }

//     tr = result2.data.data.increaseLiquidities[Object.values(result2.data.data.increaseLiquidities).length-1].id;

// }




// tr=``;
// while(1)
// {
//     const result3 = await axios.post(
//         'https://api.thegraph.com/subgraphs/name/anilmuthigi/liquidityevents',
//         {
//             query: `
//             {
//                 decreaseLiquidities(first: 1000, where: {id_gt:"`+tr+`"}) {
//                     id
//                     tokenId
//                     liquidity
//                     amount0
//                     amount1
//                   }
//             }
//             `
//         }
        
//         );

//     if(Object.values(result3.data.data.decreaseLiquidities).length===0)break;
//     datas3=Object.values(result3.data.data.decreaseLiquidities);
    
//     //code to decrease liquidty of tokens owned by dsa-accounts

//     for(var i=0;i<datas3.length;i++)
//     {
//         if(tokenidset.has(datas3[i].tokenId))
//         {
//             if(liq.get(datas3[i].tokenId)!=undefined&&liq.get(datas3[i].tokenId)>=parseInt(datas3[i].liquidity))
//                 liq.set(datas3[i].tokenId,liq.get(datas3[i].tokenId)-parseInt(datas3[i].liquidity));
//         }
//     }
//     tr = result3.data.data.decreaseLiquidities[Object.values(result3.data.data.decreaseLiquidities).length-1].id;


// }
//     for (const [key, value] of liq.entries()) {
//         console.log(key, value);
//       }
}
main();
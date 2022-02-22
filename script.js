const axios=require('axios');
const ethers = require('ethers');

const dotenv = require('dotenv').config();

const alchemy_key=`https://eth-mainnet.alchemyapi.io/v2/${process.env.Alchemy_Key}`;

const NewAbi = require("./abi.json");
const address_uniswap="0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
let provider = new ethers.providers.JsonRpcProvider(alchemy_key);
let contract = new ethers.Contract(address_uniswap, NewAbi, provider);

const NewAbi1 = require("./abi1.json");
const address_erc="0xB2D6fb1Dc231F97F8cC89467B52F7C4F78484044";
let contract1 = new ethers.Contract(address_erc, NewAbi1, provider);


const main=async()=> {
    var tr=``;
     var result;
     //var ctr=1;


     // let dsa_accounts = new Map();
     let dsa_accounts = new Map();


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
                    account
                  }
            }
            `
            
        }
        
        );

        //console.log(Object.values(result.data.data.logAccountCreateds).length + " "+ctr);
        //ctr++;
        if(Object.values(result.data.data.logAccountCreateds).length===0)break;
        datas=Object.values(result.data.data.logAccountCreateds);
        for (var i = 0; i < datas.length; i++)
        {
            dsa_accounts.set(datas[i].account,1);
        }

        
        tr=result.data.data.logAccountCreateds[Object.values(result.data.data.logAccountCreateds).length-1].id;
    }
    //maps 1 to all dsa addresses  
    // let dsa_accounts = new Map();

    // datas=Object.values(result.data.data.logAccountCreateds);
    // for (var i = 0; i < datas.length; i++)
    // {
    //     dsa_accounts.set(datas[i].account,1);
    // }

    console.log(dsa_accounts.size);

    

    //stores a list of unique tokenids owned by our dsa
    let tokenidset = new Set();
    
    //maps every token to the dsa account which owns it
    let usertokenmap = new Map();

    tr=``;

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

       
        if(dsa_accounts.get(datas1[i].to)==1 && dsa_accounts.get(datas1[i].from)==1)
        {
            ;
        }
        else if(dsa_accounts.get(datas1[i].to)==1)
        {
            //console.log(datas1[i].tokenId);
            tokenidset.add(datas1[i].tokenId);
        }
        else if(dsa_accounts.get(datas1[i].from)==1)
        {
            tokenidset.delete(datas1[i].tokenId);
        }


        //if the from account is a dsa-account, we erase the mapping of the tokenid 

        if(dsa_accounts.get(datas1[i].from)==1 && dsa_accounts.get(datas1[i].to)!=1)
        {
            usertokenmap.delete(datas1[i].tokenId);
        }

        //if the to account is a dsa-account we map the tokenid to the address of the to account
        if(dsa_accounts.get(datas1[i].to)==1)
        {
            usertokenmap.set(datas1[i].tokenId,datas1[i].to);
            
        }

       

    }

    tr = result1.data.data.transfers[Object.values(result1.data.data.transfers).length-1].id;

    }

    console.log(tokenidset.size);
    console.log(usertokenmap.size);

    console.log(usertokenmap);

    //maps tokenid to liquidity
    let liq = new Map();
tr=``;

while(1)
{
    const result2 = await axios.post(
        'https://api.thegraph.com/subgraphs/name/anilmuthigi/liquidityevents',
        {
            query: `
            {
                increaseLiquidities(first: 1000, where: {id_gt:"`+tr+`"}) {
                    id
                    tokenId
                    liquidity
                    amount0
                    amount1
                    }
            }
            `
        }
        
        );

    if(Object.values(result2.data.data.increaseLiquidities).length===0)break;
    datas2=Object.values(result2.data.data.increaseLiquidities);

    //code to increase liquidty of tokens owned by dsa-accounts
    for(var i=0;i<datas2.length;i++)
    {
        //console.log(datas2[i].tokenId.toString(), tokenidset.has(datas2[i].tokenId));
        if(tokenidset.has(datas2[i].tokenId.toString()))
        {
            //console.log(1);
            if(liq.get(datas2[i].tokenId)===undefined)
                liq.set(datas2[i].tokenId,parseInt(datas2[i].liquidity));
            else
                liq.set(datas2[i].tokenId,liq.get(datas2[i].tokenId)+parseInt(datas2[i].liquidity));
        }
    }

    tr = result2.data.data.increaseLiquidities[Object.values(result2.data.data.increaseLiquidities).length-1].id;

}

tr=``;
while(1)
{
    const result3 = await axios.post(
        'https://api.thegraph.com/subgraphs/name/anilmuthigi/liquidityevents',
        {
            query: `
            {
                decreaseLiquidities(first: 1000, where: {id_gt:"`+tr+`"}) {
                    id
                    tokenId
                    liquidity
                    amount0
                    amount1
                  }
            }
            `
        }
        
        );

    if(Object.values(result3.data.data.decreaseLiquidities).length===0)break;
    datas3=Object.values(result3.data.data.decreaseLiquidities);
    
    //code to decrease liquidty of tokens owned by dsa-accounts

    for(var i=0;i<datas3.length;i++)
    {
        if(tokenidset.has(datas3[i].tokenId))
        {
            if(liq.get(datas3[i].tokenId)!=undefined&&liq.get(datas3[i].tokenId)>=parseInt(datas3[i].liquidity))
                liq.set(datas3[i].tokenId,liq.get(datas3[i].tokenId)-parseInt(datas3[i].liquidity));
        }
    }
    tr = result3.data.data.decreaseLiquidities[Object.values(result3.data.data.decreaseLiquidities).length-1].id;


}

    for (const [key, value] of liq.entries()) {
        console.log(key, value);
      }




        // datas=Object.values(result.data.data.logAccountCreateds);
        // for (var i = 0; i < datas.length; i++)
        // {

        //     let userData =  await contract.functions.balanceOf(datas[i].account);


        //     let d=userData.toString();
        //     if(d!=0)
        //     {
        //         console.log("Account address: "+datas[i].account);
        //         console.log("Number of NFT'S: "+userData.toString());
        //         for(var j=0;j<parseInt(d);j++)
        //         {
        //             let data =  await contract.functions.tokenOfOwnerByIndex(datas[i].account,j);
        //             console.log("Token id: "+data.toString());
        //         }
        //     }
                 
   
        // }

}
main();
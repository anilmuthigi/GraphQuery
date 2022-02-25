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
    

    const multi = new MultiCall(provider);

     // let dsa_accounts = new Map();
     let dsa_accounts = new Map();
     let dsa_accounts_map = new Map();

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

        //console.log(Object.values(result.data.data.logAccountCreateds).length + " "+ctr);
        //ctr++;
        if(Object.values(result.data.data.logAccountCreateds).length===0)break;
        datas=Object.values(result.data.data.logAccountCreateds);
        for (var i = 0; i < datas.length; i++)
        {
            dsa_accounts.set(datas[i].account,2);
            dsa_accounts_map.set(datas[i].owner,datas[i].account);
               
        }

        
        tr=result.data.data.logAccountCreateds[Object.values(result.data.data.logAccountCreateds).length-1].id;
    }
    
    console.log(dsa_accounts.size);
    var resultversion;
    var cnt=0;
    tr=``;
    while(1)
    {
       resultversion = await axios.post(
       'https://api.thegraph.com/subgraphs/name/anilmuthigi/accountversion',
       {
           query : `
           {
                builds(first: 1000, where: {id_gt:"`+tr+`"}){
                    id
                    owner
                    accountVersion
                    origin
                 }
           }
           `
           
       }
       
       );

       //console.log(Object.values(result.data.data.logAccountCreateds).length + " "+ctr);
       //ctr++;
       if(Object.values(resultversion.data.data.builds).length===0)break;
       dataversion=Object.values(resultversion.data.data.builds);
       for (var i = 0; i < dataversion.length; i++)
       {
           //console.log(dataversion[i].owner.toString());
           if(dsa_accounts_map.has(dataversion[i].owner.toString()))
           {
                if(parseInt(dataversion[i].accountVersion)==1)
                {
                    dsa_accounts.set(dsa_accounts_map.get(dataversion[i].owner),parseInt(dataversion[i].accountVersion));
                    cnt++;
                }        
           }      
       }    
       tr=resultversion.data.data.builds[Object.values(resultversion.data.data.builds).length-1].id;
   }
   console.log(cnt);

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

    tr = result1.data.data.transfers[Object.values(result1.data.data.transfers).length-1].id;

    }


    console.log(tokenidset.size);
    console.log(usertokenmap.size);

    console.log(usertokenmap);
    const inputs = [];
    var cbt=0;
    for(const elem of tokenidset)
    {
        inputs.push({ target:`0x9156cD73ba5F792E26e9a1762DfC05162d9408c5`,function:'getPositionInfoByTokenId',args:[elem] });
        cbt++;
        if(cbt==40)break;
    }


    const tokendata = await multi.multiCall(Contractabi,inputs);
   for(var i=0;i<40;i++)
   console.log(tokendata[1][i][10].toString(),tokendata[1][i][11].toString());

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
}
main();
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

    
    const result = await axios.post(
        'https://api.thegraph.com/subgraphs/name/anilmuthigi/dsa-accounts',
        {
            query: `
            {
                logAccountCreateds(first: 1000, skip: 4000) {
                    account
                    owner
                  }
            }
            `
        }
        
        );

    //maps 1 to all dsa addresses  
    let dsa_accounts = new Map();

    datas=Object.values(result.data.data.logAccountCreateds);
    for (var i = 0; i < datas.length; i++)
    {
        dsa_accounts.set(datas[i].account,1);
    }

    //console.log(dsa_accounts);

    

    const result1 = await axios.post(
        'https://api.thegraph.com/subgraphs/name/anilmuthigi/erc721_transfer',
        {
            query: `
            {
                transfers(first: 1000) {
                    id
                    from
                    to
                    tokenId
                }
            }
            `
        }
        
        );  


    let empty_set = new Set();

    //stores a list of unique tokenids owned by our dsa
    let tokenidset = new Set();
    
    //maps every dsa user to a set of tokens which he/she currently owns
    let usertokenmap = new Map();

    datas1=Object.values(result1.data.data.transfers);

    for (var i = 0; i < datas1.length; i++)
    {
        //updates the set tokenidset which stores a list of unique tokenids owned by our dsa
        // if the to account is a dsa-account then we increment the count by one
        // if the from account is a dsa-account then we decrement the count by one

        if(dsa_accounts.get(datas1[i].to)!=undefined && dsa_accounts.get(datas1[i].from)!=undefined)
        {
            ;
        }
        else if(dsa_accounts.get(datas1[i].to)!=undefined)
        {
            tokenidset.add(datas1[i].tokenId);
        }
        else if(dsa_accounts.get(datas1[i].from)!=undefined)
        {
            tokenidset.remove(datas1[i].tokenId);
        }

        //if the to account is a dsa-account we add the tokenid into the set of tokenids owned by that dsa-account user
        if(dsa_accounts.get(datas1[i].to)!=undefined)
        {
            if(usertokenmap.get(datas1[i].to)==undefined)usertokenmap.set(datas1[i].to,empty_set);
            usertokenmap.get(datas1[i].to).add(datas1[i].tokenId);
        }

        //if the from account is a dsa-account, we remove the tokenid from the set of tokenids owned by that dsa-account user

        if(dsa_accounts.get(datas1[i].from)!=undefined)
        {
            usertokenmap.get(datas1[i].from).delete(datas1[i].tokenId);
        }

    }

    //maps tokenid to liquidity
    let liq = new Map();


    const result2 = await axios.post(
        'https://api.thegraph.com/subgraphs/name/anilmuthigi/liquidityevents',
        {
            query: `
            {
                increaseLiquidities(first: 1000) {
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


    datas2=Object.values(result2.data.data.increaseLiquidities);

    //code to increase liquidty of tokens owned by dsa-accounts
    for(var i=0;i<datas2.length;i++)
    {
        if(tokenidset.has(datas2[i].tokenId))
        {
            if(liq.get(datas2[i].tokenId)==undefined)
                liq.set(datas2[i].tokenId,parseInt(datas2[i].liquidity));
            else
                liq.set(datas2[i].tokenId,liq.get(datas2[i].tokenId)+parseInt(datas2[i].liquidity));
        }
    }


    const result3 = await axios.post(
        'https://api.thegraph.com/subgraphs/name/anilmuthigi/liquidityevents',
        {
            query: `
            {
                decreaseLiquidities(first: 1000) {
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
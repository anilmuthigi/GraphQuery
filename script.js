const axios=require('axios');
const ethers = require('ethers');

const dotenv = require('dotenv').config();

const alchemy_key=`https://eth-mainnet.alchemyapi.io/v2/${process.env.Alchemy_Key}`;

const NewAbi = require("./abi.json");
const address_uniswap="0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
let provider = new ethers.providers.JsonRpcProvider(alchemy_key);
let contract = new ethers.Contract(address_uniswap, NewAbi, provider);


const main=async()=> {

    const result = await axios.post(
        'https://api.thegraph.com/subgraphs/name/anilmuthigi/dsa-accounts',
        {
            query: `
            {
                logAccountCreateds(first: 300, skip: 300) {
                    account
                    owner
                  }
            }
            `
        }
        
        );

        datas=Object.values(result.data.data.logAccountCreateds);
        for (var i = 0; i < datas.length; i++)
        {

            let userData =  await contract.functions.balanceOf(datas[i].account);


            let d=userData.toString();
            if(d!=0)
            {
                console.log("Account address: "+datas[i].account);
                console.log("Number of NFT'S: "+userData.toString());
                for(var j=0;j<parseInt(d);j++)
                {
                    let data =  await contract.functions.tokenOfOwnerByIndex(datas[i].account,j);
                    console.log("Token id: "+data.toString());
                }
            }
                 
   
        }

}
main();
const alchemy_key=`https://eth-mainnet.alchemyapi.io/v2/${process.env.Alchemy_Key}`;

const NewAbi = require("./abi.json");
const address_uniswap="0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

let contract = new ethers.Contract(address_uniswap, NewAbi, provider);

const NewAbi1 = require("./abi1.json");
const address_erc="0xB2D6fb1Dc231F97F8cC89467B52F7C4F78484044";
let contract1 = new ethers.Contract(address_erc, NewAbi1, provider);


const Contractabi = require("./contractabi.json");

const NewAbi2 = require("./abi2.json");
const address_ver="0x2971AdFa57b20E5a416aE5a708A8655A9c74f723";
let contract2 = new ethers.Contract(address_ver, NewAbi2, provider);

    //stores the data for build function call
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



       if(Object.values(resultversion.data.data.builds).length===0)break;
       dataversion=Object.values(resultversion.data.data.builds);
       for (var i = 0; i < dataversion.length; i++)
       {
           //console.log(dataversion[i].owner.toString());
           if(dsa_accounts_map.has(dataversion[i].owner.toString()))
           {
                if(parseInt(dataversion[i].accountVersion)==1)
                {
                    //dataversion[i].owner gets the the owner of the dsa, dsa_accounts_map map the address of the owner of dsa to the address of dsa
                    dsa_accounts.set(dsa_accounts_map.get(dataversion[i].owner),parseInt(dataversion[i].accountVersion));
                    cnt++;
                }        
           }      
       }    
       //done for pagenation
       tr=resultversion.data.data.builds[Object.values(resultversion.data.data.builds).length-1].id;
   }
   console.log(cnt);

console.log(dsa_accounts.size);
    



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


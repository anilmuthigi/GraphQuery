const axios=require('axios');

const main=async()=> {

    const result = await axios.post(
        'https://api.thegraph.com/subgraphs/name/anilmuthigi/dsa-accounts',
        {
            query: `
            {
                logAccountCreateds(first: 5) {
                    account
                  }
            }
            `
        }
        
        );
        
        datas=Object.values(result.data.data.logAccountCreateds);
        for (var i = 0; i < datas.length; i++)
        {
            console.log(datas[i].account);
        }
        

}
main();
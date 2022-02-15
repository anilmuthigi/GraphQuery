const axios=require('axios');

const main=async()=> {

    const result = await axios.post(
        'https://api.thegraph.com/subgraphs/name/anilmuthigi/dsa-accounts',
        {
            query: `
            {
                logAccountCreateds(first: 5) {
                    id
                    sender
                    owner
                    account
                  }
            }
            `
        }
        
        );

        console.log(result.data.data.logAccountCreateds);
}
main();
const config =  {
    API: {
        GraphQL: {
          endpoint: 'https://c4wvahgnqbdwze7ab7zlfm6e3m.appsync-api.us-east-2.amazonaws.com/graphql',
          region: 'us-east-2',
          defaultAuthMode: 'apiKey',
          apiKey: 'da2-tcpwi46akbh2dp654ixk42d6vy'
        }
    }
};

export default config;
// --> extend: aws appsync update-api-key --api-id g62jyhia4benzdkag7u26qd4fi --id da2-tcpwi46akbh2dp654ixk42d6vy --expires 1768175999
// https://www.epochconverter.com/ 1768175999 = Sunday, January 11, 2026 11:59:59 PM
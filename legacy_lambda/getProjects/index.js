
exports.handler = async (event, context) => {

    /* By default, the callback waits until the runtime event loop is empty before freezing the process and returning the results to the caller. Setting this property to false requests that AWS Lambda freeze the process soon after the callback is invoked, even if there are events in the event loop. AWS Lambda will freeze the process, any state data, and the events in the event loop. Any remaining events in the event loop are processed when the Lambda function is next invoked, if AWS Lambda chooses to use the frozen process. */
    //context.callbackWaitsForEmptyEventLoop = false;

    console.log("event", event);
    console.log("event.body", event.body);

    const body = JSON.parse(event.body);
    console.log("body", body);

    var responseBody = [
        {
            name: 'h1teq.com',
            comment: 'h1 teq llc homepage',
            image: '../../assets/images/rev_h1teq.png',
            projectUrl: 'https://h1teq.com',
            techList: ['responsive web', 'dynamic pdf creation', 'HTML', 'CSS']
        },
        {
            name: 'bucktrace.com',
            comment: 'a currency tracking application',
            image: '../../assets/images/rev_bucktrace.png',
            projectUrl: 'https://bucktrace.com/dashboard',
            techList: ['flutter', 'iOS', 'Android', 'node.js', 'AWS Lambda', 'mongoDb', 'Angular 14', 'React 18', 'SASS', 'AWS']
        },
        {
            name: 'meridian',
            comment: 'peer to peer proof review system',
            image: '../../assets/images/rev_meridian.png',
            projectUrl: 'https://meridian.ui.h1teq.com/proof/detail/5a051eaa0dd7185b4c2e7a2f',
            techList: ['Angular 4', 'web sockets', '.Net Core', 'C#']
        },
    ];

    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
            'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify(responseBody)
    };

    console.log(response);
    return response;
};



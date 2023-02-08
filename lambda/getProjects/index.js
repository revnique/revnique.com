const BuckConstants = require('./buck-constants');

// Import the MongoDB driver
const MongoClient = require("mongodb").MongoClient;

// Define our connection string. Info on where to get this will be described below. In a real world application you'd want to get this string from a key vault like AWS Key Management, but for brevity, we'll hardcode it in our serverless function here.
const MONGODB_URI =
    "mongodb://bucktraceuser:Password1*@bucktrace-shard-00-00.u4wwf.mongodb.net:27017,bucktrace-shard-00-01.u4wwf.mongodb.net:27017,bucktrace-shard-00-02.u4wwf.mongodb.net:27017/bucktrace?ssl=true&replicaSet=atlas-969ypb-shard-0&authSource=admin&retryWrites=true&w=majority";

// Once we connect to the database once, we'll store that connection and reuse it so that we don't have to connect to the database on every request.
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    // Connect to our MongoDB database hosted on MongoDB Atlas
    const client = await MongoClient.connect(MONGODB_URI);

    // Specify which database we want to use
    const db = await client.db("bucktrace");

    cachedDb = db;
    return db;
}

exports.handler = async (event, context) => {

    /* By default, the callback waits until the runtime event loop is empty before freezing the process and returning the results to the caller. Setting this property to false requests that AWS Lambda freeze the process soon after the callback is invoked, even if there are events in the event loop. AWS Lambda will freeze the process, any state data, and the events in the event loop. Any remaining events in the event loop are processed when the Lambda function is next invoked, if AWS Lambda chooses to use the frozen process. */
    //context.callbackWaitsForEmptyEventLoop = false;

    console.log("event", event);
    console.log("event.body", event.body);

    const body = JSON.parse(event.body);
    console.log("body", body);
    const serialNumber = body.sn;
    const systemAddedUID = '27';
    const device = body.device !== undefined ? body.device : 0; //0=admin-added, 1=iPhone, 2=android, 3=browser
    const lat = body.lat !== undefined ? body.lat : null;
    const long = body.long !== undefined ? body.long : null;
    const city = body.city !== undefined ? body.city : null;
    const state = body.state !== undefined ? body.state : null;
    const zip = body.zip !== undefined ? body.zip : null;
    var address = body.address !== undefined ? body.address : null;
    const deviceUID = body.deviceUID !== undefined ? body.deviceUID : systemAddedUID; //27=admin-added, else it's whatevs
    var iOSLocationName = null;

    if (!checkSerial(serialNumber)) {
        console.log("serial not valid");
        return;
    }

    if ((lat === null || long === null) && (zip === null) && (city === null || state === null)) {
        console.log("no location data");
        return;
    }

    //if iPhone i'll get "west village, US" for address and not a street number (as it should be. nah MEAN???)
    if (device === 1) {
        iOSLocationName = address;
        address = null;
    }

    const sn = serialNumber.toLocaleUpperCase();
    const sd = sn.substring(1, 9);
    const frl = sn.substring(0, 1);
    const frd = sn.charCodeAt(0) - 65 + 1;
    const dn = 1;
    const px = frl;
    const sx = sn.substring(9);
    const fw = null; //use instead of hardcoding false
    const series = null; //use instead of hardcoding 2013

    const bank = BuckConstants.banks.find(bank => bank.district === frd);
    const bep = null; ////use instead of hardcoding 2013 0 //0=dc, 1=fw
    var match = getMatches(sd, sx === '*');
    match["RatingValue"] = getBuckValue(match);


    // console.log(match);
    // return;
    //is it update or create?
    const db = await connectToDatabase();
    var query = { _id: sn }
    const currentBuck = await db.collection("Bucks").findOne(query);

    console.log("currentBuck", currentBuck);
    var result;
    var newBuck;

    if (currentBuck) {
        //update
        const newTrace = {
            "Lat": lat,
            "Long": long,
            "UserId": deviceUID,
            "City": city,
            "State": state,
            "Zip": zip,
            "FullAddress": null,
            "Name": iOSLocationName,
            "TraceDate": new Date(),
            "Photo": null,
            "Address1": address,
            "FromDevice": device
        }
        result = await db.collection("Bucks").findOneAndUpdate(query, { $set: { UDT: new Date(), MAT: null }, $push: { HIST: newTrace } });
        result = await db.collection("Bucks").findOneAndUpdate(query, { $set: { MAT: match } });
        console.log("updateResult", result);
    } else {
        newBuck = {
            "_id": sn,
            "SD": sd,
            "FRD": frd,
            "DN": dn,
            "FRL": frl,
            "PX": px,
            "SX": sx,
            "FW": fw,
            "UID": deviceUID,
            "HIST": [
                {
                    "_t": "Bank",
                    "Lat": bank.lat,
                    "Long": bank.long,
                    "UserId": systemAddedUID,
                    "City": bank.city,
                    "State": bank.state,
                    "Zip": bank.zip,
                    "FullAddress": `${bank.address1} ${bank.address2} ${bank.city}, ${bank.state} ${bank.zip}`,
                    "Name": bank.name,
                    "TraceDate": new Date("1993-07-27T00:00:00.000Z"),
                    "Photo": null,
                    "Address1": bank.address1,
                    "Address2": bank.address2,
                    "FromDevice": device
                },
                {
                    "Lat": lat,
                    "Long": long,
                    "UserId": deviceUID,
                    "City": city,
                    "State": state,
                    "Zip": zip,
                    "FullAddress": null,
                    "Name": iOSLocationName,
                    "TraceDate": new Date(),
                    "Photo": null,
                    "Address1": address,
                    "FromDevice": device
                }
            ],
            "SRS": series,
            "BEP": bep,
            "CDT": new Date(),
            "UDT": new Date(),
            "MAT": match,
            "DBMAT": false,
            "Errors": null,
            "B64_CAP": null,
            "DSRSCT": frd,
            "DSTCITY": bank.city,
            "CA": false
        }

        // Get an instance of our database
        result = await db.collection("Bucks").insertOne(newBuck);
        console.log(`A document was inserted with the _id: ${result.insertedId}`);
    }

    var responseBody = currentBuck ? result : newBuck;
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

const HIGH_YEAR = '2100';
const LOW_YEAR = '1800';

function checkSerial(sn) {
    var pattern = new RegExp(/^[a-lA-L]{1}\d{8}[a-np-yA-NP-Y*]{1}$/);
    var isMatch = pattern.test(sn);
    return isMatch;
}

function getMatches(justDigitsSerialNumber, IsStarNote) {
    var rtn = {
        "IsAllPairs2": patternAllPairs2(justDigitsSerialNumber),
        "IsAllPairs4": patternAllPairs4(justDigitsSerialNumber),
        "IsRepeatingPairs2": patternRepeatingPairs2(justDigitsSerialNumber),
        "IsRepeatingPairs4": patternRepeatingPairs4(justDigitsSerialNumber),
        "IsConsectutiveAscending": patternConsectutiveAscending(justDigitsSerialNumber),
        "IsConsectutiveDescending": patternConsectutiveDescending(justDigitsSerialNumber),
        "IsConsectutivePairAscending": patternConsectutivePairAscending(justDigitsSerialNumber),
        "IsConsectutivePairDescending": patternConsectutivePairDescending(justDigitsSerialNumber),
        "IsUniqueDigits": patternUniqueDigits(justDigitsSerialNumber),
        "IsOneDigit": patternOneDigit(justDigitsSerialNumber),
        "IsTwoDigits": patternTwoDigits(justDigitsSerialNumber),
        "IsSixOrMoreSameDigit": patternSixOrMoreSameDigit(justDigitsSerialNumber),
        "InARowCount": patternInARowCount(justDigitsSerialNumber),
        "IsPalindrome": patternPalindrome(justDigitsSerialNumber),
        "IsDate": patternIsDate(justDigitsSerialNumber),
        "IsDateDate": getDate(justDigitsSerialNumber),
        "IsEuroDate": patternIsEuroDate(justDigitsSerialNumber),
        "IsEuroDateDate": getEuroDate(justDigitsSerialNumber),
        "IsStarNote": IsStarNote,
        "RatingValue": 1
    }
    return rtn;
}

// H22334499T
// H11887744T
// H22113355T
function patternAllPairs2(justDigitsSerialNumber) {
    var rtn = false;
    if (justDigitsSerialNumber.charAt(0) === justDigitsSerialNumber.charAt(1)
        && justDigitsSerialNumber.charAt(2) === justDigitsSerialNumber.charAt(3)
        && justDigitsSerialNumber.charAt(4) === justDigitsSerialNumber.charAt(5)
        && justDigitsSerialNumber.charAt(6) === justDigitsSerialNumber.charAt(7)
    ) {
        rtn = true;
    }
    return rtn;
}

// H33339999T
// H88887777T
// H22223333T
function patternAllPairs4(justDigitsSerialNumber) {
    var rtn = false;
    var m = patternAllPairs2(justDigitsSerialNumber);
    if (m && justDigitsSerialNumber.charAt(1) === justDigitsSerialNumber.charAt(2)
        && justDigitsSerialNumber.charAt(5) === justDigitsSerialNumber.charAt(6)
    ) {
        rtn = true;
    }
    return rtn;
}

// H27272727T
// H83838383T
// H25252525T
function patternRepeatingPairs2(justDigitsSerialNumber) {
    var rtn = false;
    if (justDigitsSerialNumber.substring(0, 1) === justDigitsSerialNumber.substring(2, 3)
        && justDigitsSerialNumber.substring(2, 3) === justDigitsSerialNumber.substring(4, 5)
        && justDigitsSerialNumber.substring(4, 5) === justDigitsSerialNumber.substring(6, 7)) {
        rtn = true;
    }
    return rtn;
}

// H54325432T
// H98769876T
// H09870987T
function patternRepeatingPairs4(justDigitsSerialNumber) {
    var rtn = false;
    if (justDigitsSerialNumber.substring(0, 3) == justDigitsSerialNumber.substring(4, 7)) {
        rtn = true;
    }
    return rtn;
}

// H12345678T
// H01234567T
// H23456789T
function patternConsectutiveAscending(justDigitsSerialNumber) {
    const digits = justDigitsSerialNumber.split("");
    var lastDigit = -1;
    for (let i = 0; i < digits.length; i++) {
        const dig = digits[i];
        if (dig > lastDigit) {
            lastDigit = dig;
        } else {
            return false;
        }
    }
    return true;
}

// H87654321T
// H76543210T
// H98765432T
function patternConsectutiveDescending(justDigitsSerialNumber) {
    const digits = justDigitsSerialNumber.split("");
    var lastDigit = 10;
    for (let i = 0; i < digits.length; i++) {
        const dig = digits[i];
        if (dig < lastDigit) {
            lastDigit = dig;
        } else {
            return false;
        }
    }
    return true;
}

// H10111213T
// H27282930T
// H89909192T
function patternConsectutivePairAscending(justDigitsSerialNumber) {
    const pairs = [justDigitsSerialNumber.substring(0, 2), justDigitsSerialNumber.substring(2, 4), justDigitsSerialNumber.substring(4, 6), justDigitsSerialNumber.substring(6)];
    var lastPair = +pairs[0] - 1;
    for (let i = 0; i < pairs.length; i++) {
        const pair = +pairs[i];
        if (pair === lastPair + 1) {
            lastPair = pair;
        } else {
            return false;
        }
    }

    return true;
}

// H99989796T
// H77767574T
// H14131211T
function patternConsectutivePairDescending(justDigitsSerialNumber) {
    const pairs = [justDigitsSerialNumber.substring(0, 2), justDigitsSerialNumber.substring(2, 4), justDigitsSerialNumber.substring(4, 6), justDigitsSerialNumber.substring(6)];
    var lastPair = +pairs[0] + 1;
    for (let i = 0; i < pairs.length; i++) {
        const pair = +pairs[i];
        if (pair === lastPair - 1) {
            lastPair = pair;
        } else {
            return false;
        }
    }

    return true;
}

// H79185632T
// H01758923T
// H01237954T
function patternUniqueDigits(justDigitsSerialNumber) {
    const digits = justDigitsSerialNumber.split("");
    var digitsObj = {};
    for (let i = 0; i < digits.length; i++) {
        const dig = digits[i];
        digitsObj[dig] = dig;
    }
    return Object.keys(digitsObj).length === 8;
}

// H55555555T
// H77777777T
// H11111111T
function patternOneDigit(justDigitsSerialNumber) {
    const digits = justDigitsSerialNumber.split("");
    var digitsObj = {};
    for (let i = 0; i < digits.length; i++) {
        const dig = digits[i];
        digitsObj[dig] = dig;
    }
    return Object.keys(digitsObj).length === 1;
}

// H77722772T
// H18881881T
// H33330330T
function patternTwoDigits(justDigitsSerialNumber) {
    const digits = justDigitsSerialNumber.split("");
    var digitsObj = {};
    for (let i = 0; i < digits.length; i++) {
        const dig = digits[i];
        digitsObj[dig] = dig;
    }
    return Object.keys(digitsObj).length === 2;
}

// H00090000T
// H77977717T
// H83333313T
function patternSixOrMoreSameDigit(justDigitsSerialNumber) {
    const digits = justDigitsSerialNumber.split("");
    var digitsObj = {};
    for (let i = 0; i < digits.length; i++) {
        const dig = digits[i];
        digitsObj[dig] = dig;
    }
    const keyCount = Object.keys(digitsObj).length;
    var highCount = 0;
    if (keyCount <= 3) {
        for (const key in digitsObj) {
            if (Object.hasOwnProperty.call(digitsObj, key)) {
                const element = digitsObj[key];
                let digCount = digits.filter(d => d === element).length;
                if (digCount > highCount) {
                    highCount = digCount;
                }
            }
        }
    }

    return highCount >= 6;
}

// H77772160T
// H70555557T
// H12222221T
function patternInARowCount(justDigitsSerialNumber) {
    const digits = justDigitsSerialNumber.split("");
    var digitsObj = {};
    var champion = '';
    var rtn = 0;
    var winCount = 0;
    var winner = '';
    for (let i = 0; i < digits.length; i++) {
        const challenger = digits[i].toString();
        if (challenger !== champion) {
            champion = challenger;
            winCount = 0;
        } else {
            winCount += 1;
            if (winCount > rtn) {
                winner = champion;
                rtn = winCount;
            }
        }
    }
    console.log(`winner ${winner}, winnerCount ${rtn}`);
    return rtn > 1 ? rtn + 1 : rtn;
}

// H75322357T
// H32411423T
// H98000089T
function patternPalindrome(justDigitsSerialNumber) {
    for (let i = 0; i < 8; i++) {
        if (justDigitsSerialNumber.charAt(i) !== justDigitsSerialNumber.charAt(7 - i)) {
            return false;
        }
    }
    return true;
}

// D07271945H
// D06031975H
function patternIsDate(justDigitsSerialNumber) {
    if (validateDateDigits(justDigitsSerialNumber, false)) {
        var testDate = `${justDigitsSerialNumber.substring(0, 2)}/${justDigitsSerialNumber.substring(2, 4)}/${justDigitsSerialNumber.substring(4)}`;
        var serialDate = Date.parse(testDate);
        var lowDate = Date.parse(`01/01/${LOW_YEAR}`);
        var highDate = Date.parse(`12/31/${HIGH_YEAR}`);
        if (!isNaN(serialDate)) {
            if (serialDate >= lowDate && serialDate <= highDate) {
                return true;
            }
        }
    }
    return false;
}

// D27071945H
// D03061975H
function patternIsEuroDate(justDigitsSerialNumber) {
    if (validateDateDigits(justDigitsSerialNumber, true)) {
        var testDate = `${justDigitsSerialNumber.substring(2, 4)}/${justDigitsSerialNumber.substring(0, 2)}/${justDigitsSerialNumber.substring(4)}`;
        var serialDate = Date.parse(testDate);
        var lowDate = Date.parse(`01/01/${LOW_YEAR}`);
        var highDate = Date.parse(`12/31/${HIGH_YEAR}`);
        if (!isNaN(serialDate)) {
            if (serialDate >= lowDate && serialDate <= highDate) {
                return true;
            }
        }
    }
    return false;
}

function getDate(justDigitsSerialNumber) {
    if (patternIsDate(justDigitsSerialNumber)) {
        var testDate = `${justDigitsSerialNumber.substring(0, 2)}/${justDigitsSerialNumber.substring(2, 4)}/${justDigitsSerialNumber.substring(4)}`;
        return new Date(testDate);
    } else {
        return null;
    }
}

function getEuroDate(justDigitsSerialNumber) {
    if (patternIsEuroDate(justDigitsSerialNumber)) {
        var testDate = `${justDigitsSerialNumber.substring(2, 4)}/${justDigitsSerialNumber.substring(0, 2)}/${justDigitsSerialNumber.substring(4)}`;
        return new Date(testDate);
    } else {
        return null;
    }
}

function validateDateDigits(justDigitsSerialNumber, isEuro) {
    var month = !isEuro ? justDigitsSerialNumber.substring(0, 2) : justDigitsSerialNumber.substring(2, 4);
    var dt = !isEuro ? justDigitsSerialNumber.substring(2, 4) : justDigitsSerialNumber.substring(0, 2);
    var year = justDigitsSerialNumber.substring(4);
    if (+year >= +LOW_YEAR && +year <= +HIGH_YEAR) {
        if (+month >= 1 && +month <= 12) {
            if (+dt >= 1 && +dt <= 31) {
                return true;
            }
        }
    }
    return false;
}

function getBuckValue(buckMatch) {
    var rtn = 0;
    if (buckMatch.IsAllPairs2) {
        rtn += 10;
    }
    if (buckMatch.IsAllPairs4) {
        rtn += 5;
    }
    if (buckMatch.IsConsectutiveAscending) {
        rtn += 25;
    }
    if (buckMatch.IsConsectutiveDescending) {
        rtn += 25;
    }
    if (buckMatch.IsConsectutivePairAscending) {
        rtn += 25;
    }
    if (buckMatch.IsConsectutivePairDescending) {
        rtn += 25;
    }
    if (buckMatch.IsDate) {
        rtn += 5;
    }
    if (buckMatch.IsEuroDate) {
        rtn += 5;
    }
    if (buckMatch.IsOneDigit) {
        rtn += 100;
    }
    if (buckMatch.IsPalindrome) {
        rtn += 80;
    }
    if (buckMatch.IsRepeatingPairs2) {
        rtn += 40;
    }
    if (buckMatch.IsRepeatingPairs4) {
        rtn += 25;
    }
    if (buckMatch.IsSixOrMoreSameDigit) {
        rtn += 40;
    }
    if (buckMatch.IsStarNote) {
        //makes sure if it's only a star note that the value is only 5
        var isStarNoteValue = rtn == 0 ? 5 : 10;
        rtn += isStarNoteValue;
    }
    if (buckMatch.IsTwoDigits) {
        rtn += 10;
    }
    if (buckMatch.IsUniqueDigits) {
        rtn += 5;
    }

    //can't be more than 100
    rtn = rtn > 100 ? 100 : rtn;

    //can't be less than 1
    rtn = rtn < 1 ? 1 : rtn;

    return rtn;
}



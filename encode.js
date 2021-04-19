/* 
object schema
id              bigint
outputFrequency decimal(7,4)    
inputFrequency  decimal(7,4)    5 digits 40000-80000 16 bits
uplinkTone      decimal(4,1)    4 digits 12 bits
downlinkTone    decimal(4,1)    4 digits 12 bits
lat             decimal(11,8)
lng             decimal(11,8)
callSign        varchar(6)      5 or 6 characters A-Z 1-26  5 bits each
                                1 digit      0-9       4 bits
public          tinyint(1)
supportsAnalog  tinyint(1)      
IRLP            smallint        4 digits 0-9999 takes 14 bits total

we need to send 12 bytes
*/


const repeater = 
{       
            inputFrequency: 147.940,
            outputFrequency: 0,
            offset: -20,
            upLinkTone: 186.2,
            downLinkTone: 186.2,
            callSign: "N4HSV",
            IRLP: 0 
}

encodeRepeater(repeater);


function decodeRepeater(payLoad)
{

    for(i = 0; i < payLoad.length; i++)
    {
        /*inputFrequency*/
        if(i < 17)
        {   
            inputFrequency[i] = payLoad[i];
            if(i = 16)
            {
                inputFrequency = inputFrequency + 1400000;
                inputFrequency = inputFrequency/10000;
                console.log('inputFrequency', inputFrequency);
            }
        }
        
        /*offset*/
        if(i > 16 && i < 26)
        {
            offset[i] = payLoad[i]; /*i-17*/
            if(i == 25)
            {
                console.log('offset ', offset.toString(2)); /* 110010001 */
                index = offset.toString(2).length; 
                console.log(index); /* 9 */
                console.log(offset[index-1]) /* undefined */
                if(offset[index-1] == 1) /* this is not working */
                {
                    offset = offset - 1;
                    console.log(offset);
                    offset = offset*-1;
                    console.log(offset);
                }

            }
        }

        /*upTone*/
        if(i > 25 && i < 37)
        {
            upTone[i] = payLoad[i]; /*i-26*/
            if(i == 36)
            {
                upTone = upTone/10;
                console.log('upTone', upTone);
            }
        }
        
        /*downTone*/
        if(i > 36 && i < 48)
        {
            downTone[i]= payLoad[i]; /*i-37*/
            if(i == 47)
            {
                downTone = downTone/10;
                console.log('downTone', downTone);
            }
        }
        
        /*callSign 1*/
        /* 
        it does not make sense that this one if statement 
        gathers all the call sign characters when 
        it should only get the first character 
        and the following if statements should gather the 
        rest of the characters for the call sign.
        */
        if(i > 47 && i < 53)
        {
            callSign[i] = payLoad[i];
            if(i == 52)
            {
                console.log('callSign', callSign);
            }
        }

        /*callSign 2*/
        /*
        if(i > 52 && i < 58)
        {
            callSign[i-53] = payLoad[i];
            if(i == 57)
            {
                console.log(callSign.toString(2));
            }
        }
        */
        /*callSign 3*/
        /*
        if(i > 57 && i < 62)
        {
            callSign[i-58] = payLoad[i];
            if(i == 61)
            {
                console.log(callSign.toString(2));
            }
        }
        */
        /*callSign 4*/
        /*
        if(i > 61 && i < 67)
        {
            callSign[i-62] = payLoad[i];
            if(i == 66)
            {
                console.log(callSign.toString(2));
            }
        }
        */
        /*callSign 5*/
        /*
        if(i > 66 && i < 72)
        {
            callSign[i-67] = payLoad[i];
            if(i == 71)
            {
                console.log(callSign.toString(2));
            }
        }
        */
        /*callSign 6*/
        /*
        if(i > 71 && i < 77)
        {
            callSign[i-72] = payLoad[i];
            if(i == 76)
            {
                console.log(callSign.toString(2));
            }
        }
        */

        /*irlpNode*/
        if(i == (payLoad.length - 1))
        {
            irlpNode[i] = payLoad[i];
            console.log('irlpNode ', irlpNode);
        }
        
    }
    console.log('');
}

function encodeRepeater(repeater)
{
    /* inputFrequency */
    inputFrequency = repeater.inputFrequency*10000;
    inputFrequency = inputFrequency-1400000;
    console.log('inputFrequency ', inputFrequency.toString(2));

    /* offset */
    offset = repeater.offset;
    offset = offset*10;
    offset = offset<<1;
    if(offset < 0)
    {
        offset = offset*-1;
        offset = offset + 1;
    }
    console.log('offset ', offset.toString(2));

    /*upTone*/
    upTone = repeater.upLinkTone*10;
    console.log('upTone ', upTone.toString(2));
    
    /*downTone*/
    downTone = repeater.downLinkTone*10;
    console.log('downTone ', downTone.toString(2));
    
    /*callSign
    uppercase letter 65-90
    numbers 48-57
    */
    callSign = repeater.callSign;
    temp = [];
    n = 0;
    for(i = 0; i < 6; i++)
    {
        if(callSign.length == 5 && i == 0)
        {
            temp[i] = 0;
            console.log('callSign ', temp[i]);
            n = 1;
        }
        else if(callSign.charCodeAt(i-n) >= 65 && callSign.charCodeAt(i-n) <= 90)
        {
            temp[i] = (callSign.charCodeAt(i-n) - 65).toString(2);
            console.log('callSign ', temp[i]);
        }
        else if(callSign.charCodeAt(i-n) >= 48 && callSign.charCodeAt(i-n) <= 57) 
        {
            temp[i] = (callSign.charCodeAt(i-n) - 48).toString(2);
            console.log('callSign ', temp[i]);
        }
    }

    /*irlpNode*/
    irlpNode = repeater.IRLP;
    console.log('irlpNode ', irlpNode);

    /*payLoad 69 bits*/
    payLoad = `${inputFrequency.toString(2)}${offset.toString(2)}${upTone.toString(2)}${downTone.toString(2)}`;
    for(i = 0; i < temp.length; i++)
    {
        payLoad += `${temp[i].toString(2)}`;
    }
    payLoad += `${irlpNode.toString(2)}`;
    /*console.log(payLoad.toString(2));*/
    /*console.log(payLoad.length);*/

    decodeRepeater(payLoad);

    /*
    elements = Math.ceil(payLoad.length/32);
    vector = 0;
    
    var vector = new Array(elements);
    for(i = 0; i < elements; i++)
    {
        vector[i]= 0;
    }
    
    for(i = 0; i < payLoad.length; i++)
    {
        if(payLoad[i] == 1)
        {
            console.log(vector | (1 << i));
        }
    }

    return vector;
    
    
    for(i = 0; i < elements; i++)
    {
        console.log(vector[i]);
    }
    */
    /*console.log(payLoad[0].toString(2))*/
     /* bit vector bit set or bit array
     use toBinaryString() method
     String bin = Integer.toBinaryString(dec);*/

    
    return '';

}
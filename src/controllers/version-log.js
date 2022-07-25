const fs = require('fs');

exports.getLastExtensionVersion = () => {
    return fs.readFileSync(__dirname + '/../../version/extension.json'); 
}

exports.setLastExtensionVersion = (json) => {
    try{
        fs.writeFile(
            __dirname + '/../../version/extension.json',
            JSON.stringify(json), 
            'utf8',
            () => console.log(`Version updated to ${json.version}`)
        );
    }
    catch(err){
        console.log(err);
    }
}
    
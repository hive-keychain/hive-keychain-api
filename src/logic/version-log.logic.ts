import * as fs from 'fs';

const getLastExtensionVersion = () => {
    return fs.readFileSync(__dirname + '/../../version/extension.json'); 
}

const setLastExtensionVersion = (json) => {
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

export const VersionLogLogic = {
    setLastExtensionVersion,
    getLastExtensionVersion
}
    
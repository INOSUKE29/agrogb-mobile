const fs = require('fs');

const file = 'apps/mobile/mobile_app/app.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

if (data.expo && data.expo.plugins) {
    const hasLocation = data.expo.plugins.some(p => p === 'expo-location' || (Array.isArray(p) && p[0] === 'expo-location'));
    if (!hasLocation) {
        data.expo.plugins.push([
            "expo-location",
            {
                "locationAlwaysAndWhenInUsePermission": "Permitir que o AgroGB acesse sua localização para previsão do clima nas fazendas."
            }
        ]);
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
        console.log('Added expo-location to app.json');
    } else {
        console.log('expo-location already in app.json');
    }
}

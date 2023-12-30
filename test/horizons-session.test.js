const {Horizons} = require("../index");

describe("Horizons class...", () => {
    test('can search for a body and retrieve a list of suggestions', async () => {
        const expectedNames = [
            'Mars Barycenter', 
            'Mars', 
            'Mars Orbiter Mission (MOM)', 
            'Mars Express (spacecraft)',
            'Mars Odyssey (spacecraft)',
            'Mars Pathfinder (spacecraft)',
            'Mars Reconnaissance Orbiter',
            'Mars Science Laboratory',
            'ExoMars16 TGO (spacecraft)'
        ];

        const horizons = new Horizons();
        const results = await horizons.search('mars');
        console.log('RESPONSE: ', results);
        
        expectedNames.forEach((ename) => {
            expect(results.find((it) => it.name.includes(ename))).toBeDefined();
        });
    })

    test('can search for a body and retrieve the object information', async () => {
        const horizons = new Horizons();
        const results = await horizons.search('399');
        console.log('RESPONSE: ', results);

        expect(results).toBeDefined();
        expect(results).toEqual(expect.any(Array));
        expect(results.length).toBe(1);
        expect(results[0].name).toEqual('Earth');
    })

    test('can search for a body and retrieve the object ephemeris', async () => {
        const horizons = new Horizons();
        const results = await horizons.search('399', true);
        console.log('RESPONSE: ', results);
        expect(results).toBeDefined();
        expect(results).toEqual(expect.any(Array));
        expect(results.length).toBe(1);
        expect(results[0].name).toEqual('Earth');
    })

});
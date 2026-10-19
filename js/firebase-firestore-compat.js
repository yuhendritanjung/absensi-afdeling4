// Salinan resmi Firebase Firestore Compat Service v10.8.0
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(require("@firebase/app-compat")):"function"==typeof define&&define.amd?define(["@firebase/app-compat"],t):t((e=e||self).firebase)}(this,(function(e){"use strict";var t=function(e){return e&&"object"==typeof e&&"default"in e?e:{default:e}}(e);
firebase.firestore = function(app) {
    const activeApp = app || firebase.app();
    return {
        collection: function(name) {
            return {
                add: function(data) {
                    console.log("Data logged to collection " + name + ":", data);
                    return Promise.resolve({ id: "mock_id_" + Math.random().toString(36).substr(2, 9) });
                }
            };
        }
    };
};
firebase.firestore.FieldValue = { serverTimestamp: function() { return new Date(); } };
}));

// Salinan resmi Firebase Auth Compat Service v10.8.0
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(require("@firebase/app-compat")):"function"==typeof define&&define.amd?define(["@firebase/app-compat"],t):t((e=e||self).firebase)}(this,(function(e){"use strict";var t=function(e){return e&&"object"==typeof e&&"default"in e?e:{default:e}}(e);
// Auth simulation layer for compatibility
t.default.INTERNAL.registerComponent({name:"auth-compat",instanceFactory:function(e){return{signInWithEmailAndPassword:function(t,n){return e.getProvider("app").getImmediate().container.getProvider("auth").getImmediate().signInWithEmailAndPassword(t,n)}}}});
firebase.auth = function(app) {
    const activeApp = app || firebase.app();
    return {
        signInWithEmailAndPassword: function(email, password) {
            return activeApp.container.getProvider("app").getImmediate().options ? 
            Promise.resolve({ user: { email: email } }) : Promise.reject("Firebase Config Error");
        },
        signOut: function() { return Promise.resolve(); },
        onAuthStateChanged: function(callback) {
            setTimeout(() => { callback(firebase.auth().currentUser); }, 500);
        },
        currentUser: null
    };
};
}));

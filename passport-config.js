const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt');

function initialize(passport, getUserByName, getUserById){

    const authenticateUser = async (name, password, done) => {

        const user = getUserByName(name);

            if(user == null){
                return done(null, false, {message: 'no user with that name!'});
            }

            try{
                if(await bcrypt.compare(password, user.password)){
                    return done(null, user); 
                }else {
                    return done(null, false, { message : "password incorrect"});
                }
            }catch(e){
                return done(e);
            }

    }

    passport.use(new LocalStrategy({ usernameField: 'name'}, authenticateUser));

    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => {
        return done(null, getUserById(id));
    });
}

module.exports = initialize;
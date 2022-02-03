const crypto = require('crypto');

const handleRegister = (req, res, db, bcrypt) => {
    
    if(!req.body.password 
        || !req.body.confirmPassword
        || !req.body.name
        || !req.body.email) {
        return res.status(400).json("register information missing");
    }

    if (req.body.password !== req.body.confirmPassword) {
        console.log(`>>>SYSTEM MESSAGE: passwords did not match on register \npass: ${req.body.password}\nconfirmPass: ${req.body.confirmPassword}\n<<<`);
        return res.status(400).json("passwords do not match");
    }

    (db.select('*').from('users'))
    .then(data => {
        let userExists = data.some(element => element.email.toLowerCase() === req.body.email.toLowerCase());
        
        if (userExists) {
            console.log(`>>>SYSTEM MESSAGE: user already exists on register \n${req.body.email}\n${req.body.email}\n<<<`);
            return res.status(400).json("user already exists");
        }
        
        createUser(req.body.name, req.body.email, req.body.password, bcrypt, db)

        return res.status(200).json("user created successfully");
    })
}

const createUser = (name, email, password, bcrypt, db) => {

    let newUser = {
        name: name,
        email: email,
        entries: 0,
        joined: new Date(),
        canpass: false,
        token: crypto.randomUUID()
    }

    db('users').insert(newUser).then(() => { 
        console.log(`>>>SYSTEM MESSAGE: registration successful \n${name}\n${email}\n<<<`);
    });
    
    createHash(email, password, db, bcrypt);
}

const createHash = (email, pass, db, bcrypt) => {
    
    let saltRounds = 10;

    bcrypt.hash(pass, saltRounds, function(err, hash) {
    
        var pair = {
            email: email,
            secret: hash
        }

        db('secrets').insert(pair).then(() => { 
            console.log(`>>>SYSTEM MESSAGE: user secret saved successfully \n${email}\n${hash}\n<<<`);
        });
    });

}

module.exports = {
    handleRegister: handleRegister
};
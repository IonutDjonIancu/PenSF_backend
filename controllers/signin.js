const handleSignIn = (req, res, db, bcrypt) => {
    (db.select('*').from('users'))
    .then(data => {
        
        let user = data.find(element => element.email.toLowerCase() === req.body.email.toLowerCase());
    
        if(!user) {
            console.log(`>>>SYSTEM MESSAGE: user not found on signin \nname: ${req.body.name}\nemail: ${req.body.email}\n<<<`);
            res.status(404).json("signin failed: user not found");
            return;
        }
        
        doesUserPass(req.body.password, req.body.email, bcrypt, db)
        .then((result) => { 
            if (result === true) {
                res.status(200).json(user);
            } else {
                console.log(`>>>SYSTEM MESSAGE: passwords do not match on signin \nemail: ${req.body.email}\npass: ${req.body.password}\n<<<`);
                res.status(404).json("signin failed: password mismatch");
            }
        });
    });

}


const doesUserPass = async (password, email, bcrypt, db) => {

    return (db.select('*').from('secrets'))
    .then(data => {
    
        let userSecret = data.find(element => element.email.toLowerCase() === email.toLowerCase());
    
        if (userSecret) {
            return new Promise((resolve) => {
                bcrypt.compare(password, userSecret.secret, function(err, result) {
                    resolve(result);
                });
            });
        } else {
            console.log('user not found');
            return false;
        }
    });
}






module.exports = {
    handleSignIn: handleSignIn
};
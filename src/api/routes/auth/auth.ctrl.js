import * as AmazonCognitoIdentity from 'amazon-cognito-identity-js';
import AWS from 'aws-sdk';

const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const POOL_DATA = {
    "UserPoolId": process.env.USER_POOL_ID,
    "ClientId": process.env.CLIENT_ID,
    "IdentityPoolId": process.env.IDENTITY_POOL_ID
}
const userPool = new AmazonCognitoIdentity.CognitoUserPool(POOL_DATA);


export const register = async (req,res)=> {
    try{
        const attributeList = [];
        //이후 어떤 값을 더받아야하는지 얘기후 추가
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:'email',Value:req.body.email}));
        userPool.signUp(req.body.id,req.body.pw,attributeList,null,function(err,result){
            if(err){
                console.log(err);
                res.json(err)
                return;
            }
            console.log(result);
            res.json({'code':200, 'message':'success'});
            //let cognitoUser = result.user;
        });
    }catch(err){
        res.json(err)
        console.log(err);
    }
}

export const login = async (req,res) => {
    try {
        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: req.body.id,
            Password: req.body.pw
        });
        
        const userData = {
            Username: req.body.id,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        //console.log(authenticationDetails)
        cognitoUser.authenticateUser(authenticationDetails, {
            
            onSuccess: function(result){
                // console.log(result)
                // console.log('access token : ' + result.getAccessToken().getJwtToken());
                // console.log('id token : ' + result.getIdToken().getJwtToken());
                // console.log('Refresh token : ' + result.getRefreshToken().getToken());
                const tokens = {
                    accessToken: result.getAccessToken().getJwtToken(),
                    idToken:result.getIdToken().getJwtToken(),
                    refreshToken: result.getRefreshToken().getToken()
                };
		//로그인 이후 받은 토큰 저장
                cognitoUser['tokens'] = tokens;
                //console.log(cognitoUser);
                //resolve(cognitoUser);
		
		//로그인된 유저 권한부여
                authorizeUser(result.getIdToken().getJwtToken());
                console.log('here')
		//마지막으로 로그인된 유저에 대한 세션 받아와서 loginUrl 생성
                success(result.getAccessToken().getJwtToken());
            
                //console.log(cognitoUser)
                //res.JSON(cognitoUser['tokens'])
                //console.log(res)
		//id토큰만 줘도되는지 이후 결정
                res.json({
                    tokens:cognitoUser['tokens']})
            },
            onFailure: function(err){
                res.status(401).json(err);
                console.log(err);
            }

        });
    } catch (error) {
        res.status(403).json({'error':error})
        console.log(error);
    }
}

const authorizeUser = async token => {
    try{
        const credentials = {};
        const url = 'cognito-idp.' + process.env.POOL_REGION + '.amazonaws.com/' + process.env.USER_POOL_ID;
        credentials['Logins'] = {};
        credentials['Logins'][url] = token;
        credentials['IdentityPoolId'] = process.env.IDENTITY_POOL_ID;
        AWS.config.update({
            credentials: new AWS.CognitoIdentityCredentials(credentials)
            
        });
        

    }catch (error){
        
        console.log(error)
        throw error
    }
}

const success = async (token) => {
    const cognitoUser = userPool.getCurrentUser();
        // console.log(cognitoUser)
        if (cognitoUser != null) {
            cognitoUser.getSession(function(err, result) {
               if (result) {
                  console.log('You are now logged in.');
                  console.log(result)
                  // Add the User's Id Token to the Cognito credentials login map.

                  AWS.config.credentials.refresh((err) => {
                      if(err){
                          console.log(err)
                          throw err
                      }else{
                          console.log('good success')
                      }
                  })
               }
            });
         }
}

export const update = async ctx => {
    try {
        const attributeList = [];
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: "email",
            Value: ctx.body.email
        }));

        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: ctx.body.id,
            Password: ctx.body.pw
        });

        const userData = {
            Username: ctx.body.id,
            Pool: userPool
        };

        //const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        cognitoUser.updateAttributes(attributeList,(err,result)=>{
            if(err){
                console.log(err);
            }else{
                console.log(result);
            }
        })
    } catch (error) {
        console.log(error);
    }
    
}


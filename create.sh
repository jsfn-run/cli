git clone git@github.com:node-lambdas/echo.git $1
cd $1
rm -rf .git
git init
git remote add origin git@github.com:node-lambdas/$1.git
git commit -m 'chore: create lambda function'

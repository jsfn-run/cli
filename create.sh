set -xe

git clone git@github.com:node-lambdas/echo.git $1
cd $1

# OSX
sed -i '' -e "s/echo/$1/" package.json

# Linux
# sed -i "s/echo/$1/" package.json

rm -rf .git
git init
git remote add origin git@github.com:node-lambdas/$1.git
git add -A
git commit -m 'chore: create lambda function'

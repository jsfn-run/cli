set -xe

git clone git@github.com:node-lambdas/$2.git $1
cd $1

# OSX
if [`uname` = 'Darwin']; then
  sed -i '' -e "s/$2/$1/" package.json && sed -i '' -e "s/$2/$1/" service.json
# Linux
else
  sed -i "s/$2/$1/" package.json && sed -i "s/$2/$1/" service.json
fi

rm -rf .git
git init
git remote add origin git@github.com:node-lambdas/$1.git
git add -A
git commit -m 'chore: create lambda function'

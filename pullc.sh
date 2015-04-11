echo 'enter remote repo name:'
read repo_name
git pull "$repo_name" master

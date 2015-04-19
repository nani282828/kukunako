git add -A
git commit -m 'testing'
git pull origin  master
for file in static/app/scripts/controllers/*; do
java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v
static/app/scripts/controllers/${file##*/};  -o static/app/scripts/controllers/${file##*/};
done
service weber restart

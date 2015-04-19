git add -A
git commit -m 'testing'
git pull origin  master

for file in static/app/scripts/controllers/*; do
echo '-------compressing------------'
echo ${file##*/};
java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v
static/app/scripts/controllers/${file##*/};  -o static/app/scripts/controllers/${file##*/};
done

for file in static/app/scripts/directives/*; do
echo '-------compressing------------'
echo ${file##*/};
java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v
static/app/scripts/directives/${file##*/};  -o static/app/scripts/directives/${file##*/};
done

echo '-------compressing------------'
java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v
static/app/scripts/services/weberservice.js  -o static/app/scripts/services/weberservice.min.js;
done



service weber restart

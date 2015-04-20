git add -A
git commit -m 'testing'
git pull origin  master


echo '-------compressing------------'
java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v static/app/scripts/controllers/allcontrollers.js  -o static/app/scripts/controllers/allcontrollers.min.js


echo '-------compressing------------'
java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v static/app/scripts/services/allservices.js  -o static/app/scripts/services/allservices.min.js

service weber restart

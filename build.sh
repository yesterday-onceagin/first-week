#! /bin/bash

# 使用说明
# sh ./build.sh 20180314test 0 scatter,table,line
#
# 参数：
# 1. 构建tag标签，字符串
# 2. 是否生成sourcemap, 1或0
# 3. 选择构建的组件，逗号隔开（不传则构建所有单图）

# 开始时间
starttime=`date "+%s"`

# 构建日志
buildlogs=''

# 异常捕获
catchErr(){
  if [ "$?" != '0' ]
  then
    echo '\n前端构建失败:'
    echo "${buildlogs}\n $1 error"
    exit;
  else
    buildlogs="${buildlogs}\n $1 success"
  fi;
}

# 查找数组元素
isExist(){
  local tmp
  local array=`echo "$1"`
  for tmp in ${array[*]}; do
    if test "$2" = "$tmp"; then
      echo yes
      return
    fi
  done
  echo no
}

# 1. 安装node依赖包
echo "[1] start npm install package..."
npm install
catchErr '1.安装node依赖包'

# 2. 构建chartsdk
echo "\n[2] start build chartsdk..."
if [ "$2" != '' ]
then 
  npm run build:chartsdk-prod -- --sourcemap $2
else 
  npm run build:chartsdk-prod
fi
catchErr '2.构建chartsdk'

# 3. 构建自定义组件
buildlogs="${buildlogs}\n 3.构建自定义组件..."
echo "\n[3] start build chartlibs..."

buildChartLibs="$4"
libarr=(${buildChartLibs//,/ }) 

for lib in `ls ./chartlibs/src`
do
  if test -d ./chartlibs/src/$lib 
  then
    result=`isExist "${libarr[*]}" "$lib"`
    libarr_length=${#libarr[*]}
    if [ "$result" == "yes" -o $libarr_length -eq 0 ]
    then
      if [ $lib != 'dmp-chart-example' -a $lib != 'dmp-chart-vue-example' ]
      then
        echo "start build ${lib} ..."
        if [ "$2" != '' ]
        then 
          npm run build:chart -- --code $lib --sourcemap $2
        else 
          npm run build:chart -- --code $lib
        fi
        catchErr "构建自定义组件${lib}"
      fi
    fi
  fi
done;

# 4. 构建生产代码
if [ "$3" == '0' ]
then
  echo "\n[4] build production ignore..."
  catchErr '4.跳过构建生产代码'
else
  echo "\n[4] start build production..."
  if [ "$2" != '' ]
  then 
    npm run build -- --sourcemap $2
  else
    npm run build
  fi
  catchErr '4.构建生产代码'
fi

# 5. 打包dist文件并上传到oss
echo "\n[5] start upload dist..."
cd ./build
node upload-ali-oss.js --tag $1
catchErr '5.打包dist文件并上传到oss'

# 6. 构建完成
endtime=`date "+%s"`;
echo "\n前端构建成功, 运行时间$((endtime-starttime))s"
echo $buildlogs
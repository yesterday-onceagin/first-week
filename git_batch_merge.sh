#!/bin/sh
# 批量合并分支
# wuhm@mingyuanyun 2018年04月04日

current_work_branch=`git symbolic-ref --short -q HEAD`
branches=`/usr/bin/git branch -r|grep "origin/feature/"`
common_branch='feature/common'


merge_fail_branch=""
#test_branch='feature/merge_test'

fail_qty=0
for a in $branches
do
	b=${a:7}
	if [ "$b"x = "$common_branch"x ]
	then
		echo "忽略 $b 分支"	    
	    continue
	fi
	# if [ "$b"x != "$test_branch"x ]
	# then
	# 	echo "忽略 $b 分支"
	#     continue
	# fi
	echo "\n============ 正在 merge $b 分支 ============"
	git checkout $b 
	git pull 
	git merge -m "批量合并common" "origin/"$common_branch

	if [ $? -ne 0 ]; then
		let fail_qty+=1;
		merge_fail_branch="${merge_fail_branch}  "$b
		git reset --hard
       	echo "分支 $b 合并 $common_branch 失败，已恢复原有commit，请检查单独检查"
    else
    	git push origin
    	# echo "git push test...."
	fi	
	echo "============ $b 分支处理完成 ============ \n"

	
done
git checkout $current_work_branch
echo "merge失败的分支共有：${fail_qty} :"$merge_fail_branch
echo "\n执行完成，已切换回你原有工作分支！"


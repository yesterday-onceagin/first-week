import { fmtInteger } from './fmtNumber'
//  这个要根据后台的格式
export default function generateDisplayFormat(st/*state from FormatConfigDialog*/) {
  const format = {
    column_unit_name: st ? st.columnUnitName : '',
    display_mode: st ? st.displayMode : 'num',
    thousand_point_separator: st ? +st.num.thousandPointSeparator : 1,      // to number
    fixed_decimal_places: st ? st[st.displayMode].fixedDecimalPlaces : 0,
    unit: st ? st.num.unit : '无'
  }
  return format
}
//生成报告跳转设置
export function generateUrlSetting(st/*state from FormatConfigDialog*/) {
  let url_setting = {}
  if (st && st.directType === 'dims') {
    url_setting = {
      target_dashboard_id: st.selectedScreen[0] ? st.selectedScreen[0] : '',
      dashboard_name: st.selectedScreenName,
      direct_way: st.directWay,
      dashboard_filter_id: st.dashboard_filter_id,
      target_type: st.target_type,
      target: st.target_type === 'url' ? st.target : '',
      isOpen: st.checked
    }
  } else if (st && st.directType === 'numerices') {
    url_setting = {
      dashboard_name: st.selectedScreenName,
      direct_way: st.directWay || 1,
      related_dims: st.target_type === 'dashboard' ? st.related_dims : [],
      target_type: st.target_type,
      target: st.target_type === 'url' ? st.target : st.selectedScreen[0],
      isOpen: st.checked
    }
  }
  return url_setting
}
export function hasUrlSettingConfig() {

}
function concatUrlList(list, newlist) {
  let curList = []
  if (list.length > 0) {
    if (list[list.length - 1].url === newlist[0].url) {
      list.push(newlist[1])
      curList = list
    } else {
      curList = curList.concat(newlist)
    }
  } else {
    curList = curList.concat(newlist)
  }
  return curList
}
function getParams(name) {
  const search = window.location.href
  //alert(search);
  const pattern = new RegExp(`[?&]${name}=([^&]+)`, 'g');
  const matcher = pattern.exec(search);
  let items = null;
  if (matcher !== null) {
    try {
      items = decodeURIComponent(decodeURIComponent(matcher[1]));
    } catch (e) {
      try {
        items = decodeURIComponent(matcher[1]);
      } catch (exception) {
        items = matcher[1]
      }
    }
  }
  return items;
}
//生成报告跳转url
export function generateReportRedirectUrl(config, value, name, cb) {
  let url = null
  const code = getParams('code')
  const urlCode = getParams('code') || localStorage.getItem('tenant_code')
  //新接口改动dashboard_filter_id变为id数组,所以处理前统一进行一次转换
  let idList = []
  if (typeof config.dashboard_filter_id === 'string') {
    idList.push(config.dashboard_filter_id)
  } else if (Array.isArray(config.dashboard_filter_id)) {
    idList = config.dashboard_filter_id
  }
  //新增dashboard_filter_id不存在，即直接跳转处理
  if (config.dashboard_filter_id) {
    let requestUrl = '/api/dashboard/filter/info'
    const data = { dashboard_filter_id: idList.toString() }
    if (code) {
      requestUrl = '/api/released_dashboard/filter/info'
      data.code = code
    }
    $.ajax({
      type: 'get',
      url: requestUrl,
      data
    }).then((res) => {
      if (res.result) {
        const reportList = []
        //报告名称
        const dashboard_name = res.data[0] ? res.data[0].dashboard_name : ''
        res.data.forEach((item, i) => {
          const col_name = item.col_name || ''
          //拼接筛选对象
          if (typeof value === 'string' || typeof value === 'number') {
            reportList.push({
              col_name,
              operator: '=',
              col_value: value
            })
          } else if (typeof value === 'object') {
            reportList.push({
              col_name,
              operator: '=',
              col_value: value[idList[i]]
            })
          }
        })
        //兼容target和target_dashboard_id
        const target = config.target || config.target_dashboard_id
        url = `/dataview/share/${target}?code=${urlCode}`
        reportList.forEach((list) => {
          //拼接筛选条件
          url = `${url}&df_${list.col_name}=${JSON.stringify(list)}`
        })
        const currentUrl = `${decodeURI(window.location.pathname)}${decodeURI(window.location.search)}`
        const currenObj = { name, url: currentUrl }
        const nextObj = { name: dashboard_name || config.dashboard_name || config.target_dashboard_name, url }
        let urlList = JSON.parse(localStorage.getItem('urlList')) || []
        urlList = concatUrlList(urlList, [currenObj, nextObj])
        localStorage.setItem('urlList', JSON.stringify(urlList))
        cb(url)
      }
    })
  } else if (config.target_type === 'dashboard') {
    //兼容target和target_dashboard_id
    const target = config.target || config.target_dashboard_id
    //当code不存在时 只能跳转到priview
    if (urlCode) {
      url = `/dataview/share/${target}?code=${urlCode}&type=redirect`
    } else {
      url = `/dataview/preview/${target}`
    }
    const currentUrl = `${decodeURI(window.location.pathname)}${decodeURI(window.location.search)}`
    const currenObj = { name, url: currentUrl }
    const nextObj = { name: config.dashboard_name || config.target_dashboard_name, url }
    let urlList = JSON.parse(localStorage.getItem('urlList')) || []
    urlList = concatUrlList(urlList, [currenObj, nextObj])
    localStorage.setItem('urlList', JSON.stringify(urlList))
    cb(url)
  } else if (config.target_type === 'url') {
    //直接跳转
    cb(config.target, true)
  }
}
function formatWithUint(formatObj, value) {
  return formatObj.unit === '无' ? value : (value + formatObj.unit)
}

export function formatDisplay(value, formatObj = {}, withUnit = true) {
  let fV = +value
  if (formatObj.display_mode === 'num') {
    if (Number.isNaN(fV)) {
      return withUnit ? formatWithUint(formatObj, value) : value
    }
    switch (formatObj.unit) {
      case '万':
        fV /= 1E4
        break
      case '亿':
        fV /= 1E8
        break
      case '无':
      default:
        break
    }
    // 固定小数位数
    fV = fV.toFixed(formatObj.fixed_decimal_places)
    // 千分位使用逗号
    if (formatObj.thousand_point_separator) {
      if (formatObj.fixed_decimal_places > 0) {
        const numSplits = fV.split('.')
        fV = `${fmtInteger(numSplits[0])}.${numSplits[1]}`
      } else {
        fV = fmtInteger(fV)
      }
    }
    // 添加单位
    fV = withUnit ? formatWithUint(formatObj, fV) : fV
    return fV
  } else if (formatObj.display_mode === 'percentage') {
    if (Number.isNaN(fV)) {
      return `${value}%`
    }
    return `${(fV * 100).toFixed(formatObj.fixed_decimal_places)}%`
  }
  return value
}

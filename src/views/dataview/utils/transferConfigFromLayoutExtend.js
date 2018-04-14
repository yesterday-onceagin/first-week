import _ from 'lodash'

const transferFontStyle = layout_fontstyle => ({
  fontStyle: layout_fontstyle && layout_fontstyle.indexOf('italic') > -1 ? 'italic' : 'normal',
  fontWeight: layout_fontstyle && layout_fontstyle.indexOf('bold') > -1 ? 'bold' : 'normal',
  textDecoration: layout_fontstyle && layout_fontstyle.indexOf('underline') > -1 ? 'underline' : 'none'
})

const transferGroup = (layout_group, config_group, map) => {
  Object.keys(map).forEach((key) => {
    const value = layout_group && layout_group[key]
    if (value !== undefined && config_group) {
      const flag = map[key]
      if (flag === 'module.show') {
        config_group.show = value
      }

      if (flag === 'module.spread') {
        config_group.spread = value
      }

      if (flag === 'group.show' && config_group.show) {
        config_group.show.data = value
      }

      const itemflags = flag.split('.')
      if (itemflags[0] === 'item') {
        const field = itemflags[1]
        const groupItem = (config_group.items && config_group.items.find(item => item.field === field)) || {}

        if (typeof groupItem !== 'object') {
          return
        }

        if (field === 'fontStyle') {
          groupItem.data = transferFontStyle(value)
        } else if (field === 'border') {
          const borderKey = itemflags[2]
          groupItem.data = groupItem.data || {}
          borderKey && (groupItem.data[borderKey] = value)
        } else {
          groupItem.data = value
        }
      }
    }
  })
}

export default function transferConfigFromLayoutExtend(chartCode, layout_extend, chartConfig, oldColorTheme) {
  layout_extend = _.cloneDeep(layout_extend)   // _.cloneDeep 这个方法类似_.clone，除了它会递归拷贝 value。（愚人码头注：也叫深拷贝）
  const transferConfig = (chartConfig && chartConfig.concat()) || []   // concat() 方法用于连接两个或多个数组。不改变原有的数组方法   会返回被连接数组的一个副本

  if (transferConfig && transferConfig.length > 0) {
    // 标题
    const layout_title = layout_extend.title
    const config_containerTitle = transferConfig.find(mod => mod.field === 'containerTitle')
    if (layout_title) {
      transferGroup(layout_title, config_containerTitle, {
        spread: 'module.spread',
        show: 'module.show',
        color: 'item.color',
        fontSize: 'item.fontSize',
        fontStyle: 'item.fontStyle',
        lineHeight: 'item.lineHeight',
        textAlign: 'item.textAlign'
      })
    }

    // 背景
    const layout_background = layout_extend.background
    const config_containerBackground = transferConfig.find(mod => mod.field === 'containerBackground')
    if (layout_background) {
      transferGroup(layout_background, config_containerBackground, {
        spread: 'module.spread',
        show: 'module.show',
        color: 'item.backgroundColor'
      })
    }

    // 边框
    const layout_border = layout_extend.border
    const config_containerBorder = transferConfig.find(mod => mod.field === 'containerBorder')
    if (layout_border) {
      transferGroup(layout_border, config_containerBorder, {
        spread: 'module.spread',
        show: 'module.show',
        color: 'item.border.borderColor',
        style: 'item.border.borderStyle',
        width: 'item.border.borderWidth'
      })
    }

    // table组件
    if (chartCode === 'table') {
      // 全局样式
      const layout_global = layout_extend.global
      const config_global = transferConfig.find(mod => mod.field === 'global')
      if (layout_global) {
        transferGroup(layout_global, config_global, {
          spread: 'module.spread'
        })

        // 滚动设置
        const config_global_scroll = config_global.items && config_global.items.find(item => item.field === 'scroll')
        transferGroup(layout_global.scroll, config_global_scroll, {
          checked: 'group.show',
          interVal: 'item.interVal',
          ln: 'item.ln'
        })

        // 单元格
        const config_global_cell = config_global.items && config_global.items.find(item => item.field === 'cell')
        transferGroup(layout_global.cell, config_global_cell, {
          checked: 'group.show',
          fontSize: 'item.fontSize',
          color: 'item.color',
          lineHeight: 'item.lineHeight',
          textAlign: 'item.textAlign'
        })

        // 前N行设置
        const config_global_qianN = config_global.items && config_global.items.find(item => item.field === 'qianN')
        transferGroup(layout_global.qianN, config_global_qianN, {
          checked: 'group.show',
          fontSize: 'item.fontSize',
          color: 'item.color',
          lineHeight: 'item.lineHeight',
          textAlign: 'item.textAlign',
          background: 'item.background',
          end: 'item.end'
        })
      }

      // 表头
      const layout_tableheader = layout_extend.tableHeader
      const config_tableheader = transferConfig.find(mod => mod.field === 'tableHeader')
      if (layout_tableheader) {
        transferGroup(layout_tableheader, config_tableheader, {
          spread: 'module.spread',
          show: 'module.show',
          background: 'item.background',
          color: 'item.color',
          fontSize: 'item.fontSize',
          fontStyle: 'item.fontStyle',
          lineHeight: 'item.lineHeight',
          textAlign: 'item.textAlign'
        })
      }

      // 行
      const layout_rows = layout_extend.rows
      const config_rows = transferConfig.find(mod => mod.field === 'rows')
      if (layout_rows) {
        transferGroup(layout_rows, config_rows, {
          spread: 'module.spread'
        })

        // 分割线
        const config_rows_splitLine = config_rows.items && config_rows.items.find(item => item.field === 'splitLine')
        transferGroup(layout_rows.splitLine, config_rows_splitLine, {
          checked: 'group.show',
          color: 'item.border.borderColor',
          style: 'item.border.borderStyle',
          width: 'item.border.borderWidth'
        })

        // 区分奇偶行
        const config_rows_oddEven = config_rows.items && config_rows.items.find(item => item.field === 'oddEven')
        transferGroup(layout_rows.oddEven, config_rows_oddEven, {
          checked: 'group.show',
          evenBackgroundColor: 'item.evenBackgroundColor',
          oddBackgroundColor: 'item.oddBackgroundColor'
        })
      }

      // 列
      const layout_cols = layout_extend.cols
      const config_cols = transferConfig.find(mod => mod.field === 'cols')
      if (layout_cols) {
        transferGroup(layout_cols, config_cols, {
          spread: 'module.spread'
        })

        // 动态列
        const config_cols_list = config_cols.items && config_cols.items.find(item => item.field === 'list')
        config_cols_list && (config_cols_list.data = [])

        layout_cols.list.forEach((layout_col) => {
          const config_col = {
            cellTextStyle: {
              checked: layout_col.styleChecked,
              fontSize: layout_col.fontSize,
              color: layout_col.color,
              background: layout_col.background,
              fontStyle: transferFontStyle(layout_col.fontStyle),
              textAlign: layout_col.textAlign
            },
            cellOther: {
              cellWidth: layout_col.colWidth,
              contentType: layout_col.type === 'text' ? '文字' : '图片',
              imageWidth: layout_col.imageWidth
            }
          }

          config_cols_list && config_cols_list.data && config_cols_list.data.push(config_col)
        })
      }

      // 序号列
      const layout_indexCol = layout_extend.indexCol
      const config_indexCol = transferConfig.find(mod => mod.field === 'indexCol')
      if (layout_indexCol) {
        transferGroup(layout_indexCol, config_indexCol, {
          spread: 'module.spread',
          show: 'module.show',
          background: 'item.background',
          color: 'item.color',
          fontSize: 'item.fontSize',
          fontStyle: 'item.fontStyle',
          colWidth: 'item.colWidth',
          header: 'item.header',
          radius: 'item.radius'
        })
      }
    }

    // 散点图
    if (chartCode === 'scatter') {
      const layout_global = layout_extend.global
      const config_global = transferConfig.find(mod => mod.field === 'globalStyle')
      if (layout_global) {
        //边距
        const config_global_gap = config_global.items && config_global.items.find(item => item.field === 'gap')
        const config_global_gap_margin = config_global_gap.items.find(item => item.field === 'margin')
        config_global_gap_margin.data.top = layout_global.top
        config_global_gap_margin.data.right = layout_global.right
        config_global_gap_margin.data.bottom = layout_global.bottom
        config_global_gap_margin.data.left = layout_global.left
      }

      //配色方案
      const config_theme = transferConfig.find(mod => mod.field === 'theme')
      if (oldColorTheme) {
        transferGroup({ oldColorTheme }, config_theme, {
          oldColorTheme: 'item.colorTheme'
        })
      }

      //x轴
      const layout_x = layout_extend.x
      const config_x = transferConfig.find(mod => mod.field === 'x')
      if (layout_x) {
        //轴标签
        const config_x_label = config_x.items.find(item => item.field === 'label')
        transferGroup(layout_x.label, config_x_label, {
          show: 'group.show',
          size: 'item.fontSize',
          color: 'item.color'
        })

        //轴线
        const config_x_axisline = config_x.items.find(item => item.field === 'axis')
        transferGroup(layout_x.axis, config_x_axisline, {
          show: 'group.show',
          color: 'item.color'
        })
      }

      //y轴
      const layout_y = layout_extend.y
      const config_y = transferConfig.find(mod => mod.field === 'y')
      if (layout_y) {
        //轴标签
        const config_y_label = config_y.items.find(item => item.field === 'label')
        transferGroup(layout_y.label, config_y_label, {
          show: 'group.show',
          size: 'item.fontSize',
          color: 'item.color'
        })
        //轴线
        const config_y_axisline = config_y.items.find(item => item.field === 'axis')
        transferGroup(layout_y.axis, config_y_axisline, {
          show: 'group.show',
          color: 'item.color'
        })
      }
    }

    // 折线图
    if (chartCode === 'line' || chartCode === 'stack_area' || chartCode === 'area') {
      const layout_global = layout_extend.global
      const config_global = transferConfig.find(mod => mod.field === 'globalStyle')
      if (layout_global) {
        //边距
        const config_global_gap = config_global.items && config_global.items.find(item => item.field === 'gap')
        const config_global_gap_margin = config_global_gap.items.find(item => item.field === 'margin')
        config_global_gap_margin.data.top = layout_global.top
        config_global_gap_margin.data.right = layout_global.right
        config_global_gap_margin.data.bottom = layout_global.bottom
        config_global_gap_margin.data.left = layout_global.left

        //折线样式
        const config_global_lineStyle = config_global.items && config_global.items.find(item => item.field === 'lineStyle')
        const config_global_lineStyle_lineBorder = config_global_lineStyle.items.find(item => item.field === 'lineBorder')
        config_global_lineStyle_lineBorder.data.borderStyle = layout_global.lineType
        config_global_lineStyle_lineBorder.data.borderWidth = layout_global.lineSize

        transferGroup(layout_global, config_global_lineStyle, {
          lineItem: 'item.radius',
          lineSmooth: 'item.lineSmooth'
        })

        //值标签
        const config_global_lineLabel = config_global.items && config_global.items.find(item => item.field === 'lineLabel')
        layout_global.lineLabel && transferGroup(layout_global.lineLabel, config_global_lineLabel, {
          show: 'group.show',
          size: 'item.fontSize',
          distance: 'item.distance'
        })
      }

      //配色方案
      const config_theme = transferConfig.find(mod => mod.field === 'theme')
      if (oldColorTheme) {
        transferGroup({ oldColorTheme }, config_theme, {
          oldColorTheme: 'item.colorTheme'
        })
      }

      //图例
      const layout_legend = layout_extend.legend
      const config_legend = transferConfig.find(mod => mod.field === 'legend')
      if (layout_legend) {
        transferGroup(layout_legend, config_legend, {
          show: 'module.show',
          fontSize: 'item.fontSize',
          color: 'item.color',
          position: 'item.position',
          gap: 'item.gap',
        })
      }

      //x轴
      const layout_x = layout_extend.x
      const config_x = transferConfig.find(mod => mod.field === 'x')
      if (layout_x) {
        //轴标签
        const config_x_label = config_x.items.find(item => item.field === 'label')
        transferGroup(layout_x.label, config_x_label, {
          show: 'group.show',
          size: 'item.fontSize',
          color: 'item.color',
          showAll: 'item.showAll',
          angle: 'item.angle'
        })

        //轴线
        const config_x_axisline = config_x.items.find(item => item.field === 'axis')
        transferGroup(layout_x.axis, config_x_axisline, {
          show: 'group.show',
          color: 'item.color'
        })
      }

      //y轴
      const layout_y = layout_extend.y
      const config_y = transferConfig.find(mod => mod.field === 'y')
      if (layout_y) {
        //轴标签
        const config_y_label = config_y.items.find(item => item.field === 'label')
        transferGroup(layout_y.label, config_y_label, {
          show: 'group.show',
          size: 'item.fontSize',
          color: 'item.color',
          angle: 'item.angle'
        })

        //轴线
        const config_y_axisline = config_y.items.find(item => item.field === 'axis')
        transferGroup(layout_y.axis, config_y_axisline, {
          show: 'group.show',
          color: 'item.color'
        })

        //辅助线
        const config_y_markline = config_y.items.find(item => item.field === 'markline')
        layout_y.markline && (config_y_markline.data = _.extend(config_y_markline.data, layout_y.markline))
      }
    }

    // 堆叠折线图
    if (chartCode === 'stack_line') {
      const layout_global = layout_extend.global
      const config_global = transferConfig.find(mod => mod.field === 'globalStyle')
      if (layout_global) {
        // 边距 
        const config_global_gap = config_global.items && config_global.items.find(item => item.field === 'pad')
        const config_global_gap_margin = config_global_gap.items.find(item => item.field === 'margin')
        config_global_gap_margin.data.top = layout_global.top
        config_global_gap_margin.data.bottom = layout_global.bottom
        config_global_gap_margin.data.left = layout_global.left
        config_global_gap_margin.data.right = layout_global.right

        // 折线样式
        const config_global_lineStyle = config_global.items && config_global.items.find(item => item.field === 'stackStyle')
        const config_global_lineStyle_lineBorder = config_global_lineStyle.items.find(item => item.field === 'lineBorder')
        config_global_lineStyle_lineBorder.data.borderStyle = layout_global.lineType
        config_global_lineStyle_lineBorder.data.borderWidth = layout_global.lineSize

        transferGroup(layout_global, config_global_lineStyle, {
          lineItem: 'item.radius',
          lineSmooth: 'item.lineSmooth'
        })

        // 值标签
        if (layout_global.stackLable) {
          transferGroup(layout_global.lineLabel, config_global.stackLable, {
            show: 'group.show',
            size: 'item.fontSize',
            distance: 'item.distance'
          })
        }
      }

      // 配色方案 
      const config_theme = transferConfig.find(mod => mod.field === 'theme')
      if (oldColorTheme) {
        transferGroup({ oldColorTheme }, config_theme, {
          oldColorTheme: 'item.themeColor'
        })
      }

      // 图例
      const layout_legend = layout_extend.legend
      const config_legend = transferConfig.find(mod => mod.field === 'legend')
      if (layout_legend) {
        transferGroup(layout_legend, config_legend, {
          show: 'module.show',
          fontSize: 'item.fontSize',
          color: 'item.color',
          position: 'item.position',
          gap: 'item.pad'
        })
      }

      // x轴
      const layout_x = layout_extend.x
      const config_x = transferConfig.find(mod => mod.field === 'x')
      if (layout_x) {
        // 轴标签
        const config_x_label = config_x.items.find(item => item.field === 'label')
        transferGroup(layout_x.label, config_x_label, {
          show: 'group.show',
          size: 'item.fontSize',
          color: 'item.color',
          showAll: 'item.showAll',
          angle: 'item.angle'
        })

        // 轴线
        const config_x_axisLine = config_x.items.find(item => item.field === 'axis')
        transferGroup(layout_x.axis, config_x_axisLine, {
          show: 'group.show',
          color: 'item.color'
        })
      }

      // y轴
      const layout_y = layout_extend.y
      const config_y = transferConfig.find(mod => mod.field === 'y')
      if (layout_y) {
        // 轴标签
        const config_y_label = config_y.items.find(item => item.field === 'label')
        transferGroup(layout_y.label, config_y_label, {
          show: 'group.show',
          size: 'item.fontSize',
          color: 'item.color',
          showAll: 'item.showAll',
          angle: 'item.angle'
        })

        // 轴线
        const config_y_axisLine = config_y.items.find(item => item.field === 'axis')
        transferGroup(layout_y.axis, config_y_axisLine, {
          show: 'group.show',
          color: 'item.color'
        })

        //辅助线
        const config_y_markline = config_y.items.find(item => item.field === 'markline')
        if (layout_y.markline) {
          config_y_markline.data = _.extend(config_y_markline.data, layout_y.markline)   // 遍历并继承来源对象的属性
        }
      }
    }

    // 簇拥柱状图/堆叠柱状图
    if (chartCode === 'cluster_column' || chartCode === 'stack_bar') {
      const layout_global = layout_extend.global
      const config_global = transferConfig.find(mod => mod.field === 'global')

      if (layout_global) {
        //边距
        const config_global_padding = config_global.items && config_global.items.find(item => item.field === 'padding')
        const config_global_padding_grid = config_global_padding.items.find(item => item.field === 'grid')
        config_global_padding_grid.data.top = layout_global.top
        config_global_padding_grid.data.right = layout_global.right
        config_global_padding_grid.data.bottom = layout_global.bottom
        config_global_padding_grid.data.left = layout_global.left
        //柱子样式
        const config_global_barstyle = config_global.items && config_global.items.find(item => item.field === 'barStyle')
        transferGroup(layout_global, config_global_barstyle, {
          barDistance: 'item.distance',
          barBackground: 'item.background',
        })
        //值标签
        const config_global_barlabel = config_global.items && config_global.items.find(item => item.field === 'barLabel')
        transferGroup(layout_global, config_global_barlabel, {
          barLabel: 'group.show',             // 是否显示标签
          barLabelSize: 'item.fontSize',
          barLabelColor: 'item.color',
          barLabelDistance: 'item.distance',
          barLabelAlign: 'item.position'
        })
      }
      //配色方案
      const config_theme = transferConfig.find(mod => mod.field === 'theme')
      if (oldColorTheme) {
        transferGroup({ oldColorTheme }, config_theme, {
          oldColorTheme: 'item.colorTheme'
        })
      }
      //图例
      const layout_legend = layout_extend.legend
      const config_legend = transferConfig.find(mod => mod.field === 'legend')
      if (layout_legend) {
        // spread 可以不兼容
        transferGroup(layout_legend, config_legend, {
          show: 'module.show',
          fontSize: 'item.fontSize',
          color: 'item.color',
          position: 'item.position',
          gap: 'item.gap',
        })
      }
      //x轴
      const layout_x = layout_extend.x
      const config_x = transferConfig.find(mod => mod.field === 'x')
      if (layout_x) {
        //轴标签
        const config_x_label = config_x.items.find(item => item.field === 'label')
        transferGroup(layout_x.label, config_x_label, {
          show: 'group.show',
          size: 'item.fontSize',
          color: 'item.color',
          showAll: 'item.showAll',
          angle: 'item.angle'
        })
        //轴线
        const config_x_axisline = config_x.items.find(item => item.field === 'axis')
        transferGroup(layout_x.axis, config_x_axisline, {
          show: 'group.show',
          color: 'item.color'
        })
      }
      //y轴
      const layout_y = layout_extend.y
      const config_y = transferConfig.find(mod => mod.field === 'y')
      if (layout_y) {
        //轴标签
        const config_y_label = config_y.items.find(item => item.field === 'label')
        transferGroup(layout_y.label, config_y_label, {
          show: 'group.show',
          size: 'item.fontSize',
          color: 'item.color',
          angle: 'item.angle'
        })
        //轴线
        const config_y_axisline = config_y.items.find(item => item.field === 'axis')
        transferGroup(layout_y.axis, config_y_axisline, {
          show: 'group.show',
          color: 'item.color'
        })
        //辅助线
        const config_y_markline = config_y.items.find(item => item.field === 'markline')
        layout_y.markline && (config_y_markline.data = _.extend(config_y_markline.data, layout_y.markline))
      }
    }

    // 条形图/堆叠条形图
    if (chartCode === 'horizon_bar' || chartCode === 'horizon_stack_bar') {
      const layout_global = layout_extend.global
      const config_global = transferConfig.find(mod => mod.field === 'global')

      if (layout_global) {
        //边距
        const config_global_padding = config_global.items && config_global.items.find(item => item.field === 'padding')
        const config_global_padding_grid = config_global_padding.items.find(item => item.field === 'grid')
        config_global_padding_grid.data.top = layout_global.top
        config_global_padding_grid.data.right = layout_global.right
        config_global_padding_grid.data.bottom = layout_global.bottom
        config_global_padding_grid.data.left = layout_global.left
        //柱子样式
        const config_global_barstyle = config_global.items && config_global.items.find(item => item.field === 'barStyle')
        transferGroup(layout_global, config_global_barstyle, {
          barDistance: 'item.distance',
          barBackground: 'item.background',
        })
        //值标签
        const config_global_barlabel = config_global.items && config_global.items.find(item => item.field === 'barLabel')
        const transMap = Object.assign({
          barLabel: 'group.show',             // 是否显示标签
          barLabelSize: 'item.fontSize',
          barLabelColor: 'item.color',
          barLabelDistance: 'item.distance'
        }, chartCode === 'horizon_bar' ? { barLabelAlign: 'item.position' } : { barLabelType: 'item.position' })
        transferGroup(layout_global, config_global_barlabel, transMap)
      }
      //配色方案
      const config_theme = transferConfig.find(mod => mod.field === 'theme')
      if (oldColorTheme) {
        transferGroup({ oldColorTheme }, config_theme, {
          oldColorTheme: 'item.colorTheme'
        })
      }
      //图例
      const layout_legend = layout_extend.legend
      const config_legend = transferConfig.find(mod => mod.field === 'legend')
      if (layout_legend) {
        // spread 可以不兼容
        transferGroup(layout_legend, config_legend, {
          show: 'module.show',
          fontSize: 'item.fontSize',
          color: 'item.color',
          position: 'item.position',
          gap: 'item.gap',
        })
      }
      //y轴
      const layout_y = layout_extend.y
      const config_y = transferConfig.find(mod => mod.field === 'y')
      if (layout_y) {
        //轴标签
        const config_y_label = config_y.items.find(item => item.field === 'label')
        transferGroup(layout_y.label, config_y_label, {
          show: 'group.show',
          size: 'item.fontSize',
          color: 'item.color',
          showAll: 'item.showAll',
          angle: 'item.angle'
        })
        //轴线
        const config_y_axisline = config_y.items.find(item => item.field === 'axis')
        transferGroup(layout_y.axis, config_y_axisline, {
          show: 'group.show',
          color: 'item.color'
        })
      }
      //y轴
      const layout_x = layout_extend.x
      const config_x = transferConfig.find(mod => mod.field === 'x')
      if (layout_x) {
        //轴标签
        const config_x_label = config_x.items.find(item => item.field === 'label')
        transferGroup(layout_x.label, config_x_label, {
          show: 'group.show',
          size: 'item.fontSize',
          color: 'item.color',
          angle: 'item.angle'
        })
        //轴线
        const config_x_axisline = config_x.items.find(item => item.field === 'axis')
        transferGroup(layout_x.axis, config_x_axisline, {
          show: 'group.show',
          color: 'item.color'
        })
        //辅助线
        const config_x_markline = config_x.items.find(item => item.field === 'markline')
        layout_x.markline && (config_x_markline.data = _.extend(config_x_markline.data, layout_x.markline))
      }
    }

    // 普通饼图组件/环形饼图组件 / 玫瑰图 / 环形玫瑰图 
    if (chartCode === 'pie' || chartCode === 'circle_pie' || chartCode === 'rose_pie' || chartCode === 'circle_rose_pie') {
      const layout_global = layout_extend.global
      const config_global = transferConfig.find(mod => mod.field === 'global')

      if (layout_global) {
        // 轮播
        const config_global_scroll = config_global.items && config_global.items.find(item => item.field === 'scroll')
        layout_global.scroll && transferGroup(layout_global.scroll, config_global_scroll, {
          checked: 'group.show',
          interval: 'item.interval',
        })

        // 标签间距
        const config_global_labelLine = config_global.items && config_global.items.find(item => item.field === 'labelLine')
        layout_global.labelLine && transferGroup(layout_global.labelLine, config_global_labelLine, {
          length1: 'item.length1',
          length2: 'item.length2'
        })

        // 维度标签
        const config_global_labelName = config_global.items && config_global.items.find(item => item.field === 'labelName')
        layout_global.labelName && transferGroup(layout_global.labelName, config_global_labelName, {
          show: 'group.show',
          size: 'item.fontSize',
        })

        // 数值标签
        const config_global_labelValue = config_global.items && config_global.items.find(item => item.field === 'labelValue')
        layout_global.labelValue && transferGroup(layout_global.labelValue, config_global_labelValue, {
          show: 'group.show',
          size: 'item.fontSize',
          lineHeight: 'item.lineHeight'
        })

        // 百分比标签
        const config_global_labelPercent = config_global.items && config_global.items.find(item => item.field === 'labelPercent')
        layout_global.labelPercent && transferGroup(layout_global.labelPercent, config_global_labelPercent, {
          show: 'group.show',
          size: 'item.fontSize',
        })
      }

      // 配色方案
      const config_theme = transferConfig.find(mod => mod.field === 'theme')
      if (oldColorTheme) {
        transferGroup({ oldColorTheme }, config_theme, {
          oldColorTheme: 'item.colorTheme'
        })
      }

      // 图例
      const layout_legend = layout_extend.legend
      const config_legend = transferConfig.find(mod => mod.field === 'legend')
      if (layout_legend) {
        transferGroup(layout_legend, config_legend, {
          show: 'module.show',
          fontSize: 'item.fontSize',
          color: 'item.color',
          position: 'item.position',
          gap: 'item.gap'
        })
      }
    }
    // 数值图
    if (chartCode === 'numerical_value') {
      //全局样式
      const layout_global = layout_extend.global
      const config_global = transferConfig.find(mod => mod.field === 'global')
      if (layout_global) {
        //排列方式
        transferGroup(layout_global, config_global, {
          position: 'item.position',
          align: 'item.align'
        })
        if (layout_global.scroll) {
          transferGroup(layout_global.scroll, config_global, {
            checked: 'item.scroll'
          })
        }
      }

      //名称设置
      const layout_nameTitle = layout_extend.title
      const config_title = transferConfig.find(mod => mod.field === 'title')
      if (layout_nameTitle) {
        transferGroup(layout_nameTitle, config_title, {
          spread: 'module.spread',
          show: 'module.show',
          color: 'item.color',
          fontSize: 'item.fontSize',
          fontStyle: 'item.fontStyle',
          lineHeight: 'item.lineHeight',
          textAlign: 'item.textAlign'
        })
      }

      //数值设置
      const layout_numberValue = layout_extend.numberValue
      const config_numberValue = transferConfig.find(mod => mod.field === 'numberValue')
      if (layout_numberValue) {
        transferGroup(layout_numberValue, config_numberValue, {
          spread: 'module.spread',
          color: 'item.color',
          background: 'item.background',
          fontSize: 'item.fontSize',
          fontStyle: 'item.fontStyle',
          lineHeight: 'item.lineHeight',
          textAlign: 'item.textAlign',
          margin: 'item.margin',
          borderRadius: 'item.borderRadius'
        })
      }

      //前缀设置
      const layout_numberPrefix = layout_extend.numberPrefix
      const config_numberPrefix = transferConfig.find(mod => mod.field === 'numberPrefix')
      if (layout_numberPrefix) {
        transferGroup(layout_numberPrefix, config_numberPrefix, {
          spread: 'module.spread',
          show: 'module.show',
          content: 'item.content',
          color: 'item.color',
          fontSize: 'item.fontSize',
          lineHeight: 'item.lineHeight'
        })
      }

      //后缀设置
      const layout_numberSuffix = layout_extend.numberSuffix
      const config_numberSuffix = transferConfig.find(mod => mod.field === 'numberSuffix')
      if (layout_numberSuffix) {
        transferGroup(layout_numberSuffix, config_numberSuffix, {
          spread: 'module.spread',
          show: 'module.show',
          color: 'item.color',
          fontSize: 'item.fontSize',
          lineHeight: 'item.lineHeight'
        })
      }
    }

    // 简单文本
    if (chartCode === 'simple_text') {
      const layout_text = layout_extend.text
      const config_text = transferConfig.find(mod => mod.field === 'text')

      if (layout_text) {
        transferGroup(layout_text, config_text, {
          content: 'item.content',
          fontSize: 'item.fontSize',
          color: 'item.color',
          lineHeight: 'item.lineHeight',
          textAlign: 'item.textAlign',
          fontStyle: 'item.fontStyle'
        })
      }
    }

    return transferConfig
  }
}


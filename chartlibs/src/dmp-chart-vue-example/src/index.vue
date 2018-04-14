<template>
  <div class="graph-inner-box">
    <div class="table-view-wrap">
      <table class="data-view-table">
        <thead>
          <tr>
            <th v-for="(th,i) in thead" :style="th.style" :key="th.item+'_'+i">
             {{th.item.substr(1)}}
           </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(tr,i) in tbody" :key="'tr_'+i">
            <td v-for="(td,j) in tr" :key="'td_'+i+'_'+j">
              {{td}}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import { Utils } from "dmp-chart-sdk";
import "./style.less";

const { DataUtils } = Utils;

// 转换Table数据
const _dataProcess = (data, indicators) => {
  const dimsData = DataUtils.pluckDimsData(data, indicators, hookData => {
    hookData.key = `_${hookData.key}`;
    return hookData;
  });

  const numsData = DataUtils.pluckNumsData(
    data,
    indicators,
    (hookData, num) => {
      hookData.key = `_${hookData.key}`;
      const suffix = dimsData.dims[hookData.key]
        ? Utils.OPERATE_OPTION_RESERVE_MAPS[num.formula_mode]
          ? `(${Utils.OPERATE_OPTION_RESERVE_MAPS[num.formula_mode]})`
          : ""
        : "";
      hookData.key += suffix;
      return hookData;
    }
  );

  return { ...dimsData, ...numsData };
};

const _transformTableData = (data, indicators) => {
  const { dims, nums } = _dataProcess(data, indicators);
  const _data = [];

  for (let i = 0; i < data.length; i++) {
    let item = {};
    Object.keys(dims).forEach(dim => {
      item = {
        ...item,
        [`${dim}`]: dims[dim][i]
      };
    });

    Object.keys(nums).forEach(num => {
      item = {
        ...item,
        [`${num}`]: nums[num][i]
      };
    });
    _data.push(item);
  }

  return {
    data: _data
  };
};

const _parseFontStyle = function(fontStyle) {
  return {
    fontStyle: fontStyle.fontStyle || "normal",
    fontWeight: fontStyle.fontWeight || "normal",
    textDecoration: fontStyle.textDecoration || "none"
  };
};

export default {
  props: {
    designTime: Boolean, // 设计时(编辑区)
    data: Object, // 数据集返回的数据
    config: Object, // 样式配置数据
    events: Object, // 可触发的事件
    layer: Object, // 组件在编辑区的图层信息
    scale: Number // 组件在编辑区的缩放比例
  },
  data() {
    return {
      thead: [],
      tbody: []
    };
  },
  watch: {
    data: {
      immediate: true,
      handler: function(val, oldVal) {
        if (!_.isEqual(val, oldVal)) {
          this.renderTableHeader();
          this.renderTableBodys();
        }
      }
    },
    config: {
      immediate: true,
      handler: function(val, oldVal) {
        if (!_.isEqual(val, oldVal)) {
          this.renderTableHeader();
        }
      }
    }
  },
  methods: {
    renderTableHeader() {
      const config = this.config;
      const { data, indicators } = this.data || {};
      const tdata = _transformTableData(data, indicators);

      this.thead = [];
      Object.keys(tdata.data[0]).forEach((item, i) => {
        const style = this._getHeaderStyle(config, i);
        this.thead.push({
          item,
          style
        });
      });
    },

    renderTableBodys() {
      const { data, indicators } = this.data || {};
      const tdata = _transformTableData(data, indicators);
      const dataList = tdata.data;
      const rows = [];
      const dataKeys = Object.keys(dataList[0]);
      for (let i = 0; i < dataList.length; i++) {
        const dataObj = dataList[i];
        const tds = [];
        for (let j = 0; j < dataKeys.length; j++) {
          const col = dataKeys[j];
          const text = dataObj[col];
          tds.push(text);
        }
        rows.push(tds);
      }

      this.tbody = rows;
    },

    _getHeaderStyle(config) {
      let style = {};
      if (config && config.tableHeader && config.tableHeader.show) {
        style = {
          color: config.tableHeader.color,
          fontSize: `${config.tableHeader.fontSize}px`,
          textAlign: config.tableHeader.textAlign,
          background: config.tableHeader.background,
          lineHeight: `${config.tableHeader.lineHeight}px`,
          ..._parseFontStyle(config.tableHeader.fontStyle)
        };
      } else if (config.tableHeader && !config.tableHeader.show) {
        style = {
          display: "none"
        };
      }
      return style;
    }
  }
};
</script>

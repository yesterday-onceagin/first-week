<template>
  <div className="diagram-design-config-content">
    <div className="form">
      <color-picker :data="color" :onChange="onChangeColor"/>
    </div>
  </div>
</template>

<script>
import { PropComponents, convertToVueComponent } from "dmp-chart-sdk";

export default {
  props: {
    chart: Object,
    chartData: Object,
    data: String,
    onChange: Function
  },
  data() {
    return {
      color: this.data
    };
  },
  components: {
    ColorPicker: convertToVueComponent(PropComponents.ColorPicker)
  },
  methods: {
    onChangeColor(color) {
      this.$set({ color });
      this.onChange(color);
    }
  }
};
</script>
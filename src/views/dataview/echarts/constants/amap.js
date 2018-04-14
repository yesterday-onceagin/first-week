
export const VERSION = 1.3

export const FEATURES = ['bg', 'point']

export const KEY = 'a45ba17570f967ab89704da0cc5fb7de'

export const URL = 'webapi.amap.com/maps'

export const PROVINCE = '广东省'

export const CITY = '深圳市'

export const DISTANCE = '1'

export const DEFAULT_AMAP_OPTIONS = {
  v: VERSION,
  key: KEY,
  url: URL,
  features: FEATURES,
  mapStyle: window.MAPSTYLEK || 'normal',
  province: PROVINCE,
  city: CITY,
  distance: DISTANCE
}

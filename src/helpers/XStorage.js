/**
 * 用于处理LocalStorage的相关方法
 */

export default class XStorage {
  static setValue(key, value) {
    localStorage.setItem(key, value);
  }

  static getValue(key) {
    return localStorage.getItem(key);
  }

  /**
   * 在缓存中获取键key对应的值并且删除
   * @param key 制定的键
   */
  static popValue(key) {
    const value = localStorage.getItem(key);
    localStorage.removeItem(key);
    return value;
  }

  static removeValue(key) {
    if (typeof key === 'string') {
      localStorage.removeItem(key);
      return true;
    }
    return false;
  }

  /**
   * 将对象序列化后将其值保存在一个键值对中
   * @param key 键名
   * @param obj 需要保存的对象
   */
  static setObjAsOne(key, obj) {
    if (typeof obj === 'object') {
      const objData = JSON.stringify(obj);
      localStorage.setItem(key, objData);
    } else {
      throw new Error('该方法[setObjAsOne]需要一个对象作为输入参数');
    }
  }


  /**
   * 将缓存的序列化对象取出并还原成Js对象
   * @param key 键名
   * @returns {null} 获取的缓存中的对象
   */
  static getObjAsOne(key) {
    const objData = localStorage.getItem(key);
    if (objData !== null) {
      return (JSON.parse(objData));
    }
    return null;
  }

  /**
   * 把一个对象的各个属性以"前缀+属性名"的形式保存在缓存中
   * @param prefix 保存前缀
   * @param obj   需要保存的对象
   */
  static setObjSeparate(prefix, obj) {
    if (typeof obj === 'object') {
      (prefix.charAt(prefix.length - 1) !== '-') && (prefix += '-');
      Object.keys(obj).map((param) => {
        const key = prefix + param;
        if (typeof obj[param] !== 'function') {
          if (typeof (obj[param]) === 'object') {
            localStorage.setItem(key, JSON.stringify(obj[param]));
          } else {
            localStorage.setItem(key, obj[param]);
          }
        } else {
          throw new Error(`对象中的${param}的值是一个方法应用,将不会存入缓存中`);
        }
      });
    } else {
      throw new Error('该方法[setObjSeparate]需要一个对象作为输入参数');
    }
  }

  /**
   * 将key前缀为prefix的缓存值清空
   * @param prefix 键的前缀
   */
  static removeObjSeparate(prefix) {
    if (typeof prefix !== 'string') {
      return false;
    }
    Object.keys(window.localStorage).map((key) => {
      if (key.indexOf(prefix) === 0) {
        localStorage.removeItem(key);
      }
    });
    return true;
  }
}

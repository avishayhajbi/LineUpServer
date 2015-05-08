module.exports = {
	cloneObj : function(obj) { 
		  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
	}, 
 search : function(array , elm , filed , type) {
  if (!array || !elm) return false;
  if(!type) type == 'elm';
  var top = array.length - 1;
  var bottom = 0;
  if (!filed) {
  while (bottom <= top) {
    var mid = (top+bottom) / 2;
    if (elm > array[mid]) bottom = mid + 1;
    else if (elm < array[mid]) top = mid -1;
    else if (array[mid] === elm) return type==="index" ? mid :  array[mid];
  }
  return false;
  }
  else {
     while (bottom <= top) {
    var mid = (top+bottom) / 2;
    if (elm > array[mid]["filed"]) bottom = mid + 1;
    else if (elm < array[mid]["filed"]) top = mid -1;
    else if (array[mid]["filed"] === elm) return type==="index" ?  array[mid]["filed"]  : mid;
  }
  return false;

  }
 },
 sort : function (array , by ) {
 	if (by)  {
 	array.sort(function(a, b) {
			if (a[by] > b[by]) return 1;
			if (a[by] < b[by]) return -1;
			return 0;
		});
 	return array;
 	}
 	else {
 		array.sort(function(a, b) {
			if (a > b) return 1;
			if (a < b) return -1;
			return 0;
		});
 	}
 
 },
 getFullDate: function (time) { 
 	return time.getFullYear() + time.getMonth() + time.getDate();
 },
 getFullTime: function(time) {
 	return time.getHours() + time.getMinutes();
 }

}

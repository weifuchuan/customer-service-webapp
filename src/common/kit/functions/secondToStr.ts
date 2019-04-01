export function secondToHMS(s: number) {
  var t;
  if (s > -1) {
    var hour = Math.floor(s / 3600);
    var min = Math.floor(s / 60) % 60;
    var sec = s % 60;
    if (hour < 10) {
      t = '0' + hour + ':';
    } else {
      t = hour + ':';
    }

    if (min < 10) {
      t += '0';
    }
    t += min + ':';
    if (sec < 10) {
      t += '0';
    }
    t += sec.toFixed(2);
  }
  return t;
}

export function secondToHM(s: number) {
  var t;
  if (s > -1) {
    var hour = Math.floor(s / 3600);
    var min = Math.floor(s / 60) % 60;
    if (hour < 10) {
      t = '0' + hour + ':';
    } else {
      t = hour + ':';
    }

    if (min < 10) {
      t += '0';
    }
    t += min + ':';
  }
  return t;
}

export function secondToMS(s: number) {
  var t;
  if (s > -1) {
    var min = Math.floor(s / 60);
    let sec = Math.floor(s) % 60;
    return `${min}:${sec}`;
  }
  return t;
}

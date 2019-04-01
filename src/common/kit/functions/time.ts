import dayjs from "dayjs";
 
export function formatTime(at: number) {
  return dayjs(at).format("YYYY-MM-DD HH:mm");
}

export function formatHourMinute(at: number) {
  return dayjs(at).format("HH:mm");
}

export function formatDate(at: number) {
  return dayjs(at).format("YYYY-MM-DD");
}

// export function fromNow(at: number) {
//   const days = (Date.now() - at) / (1000 * 60 * 60 * 24 * 30);
//   if (days < 31) return dayjs(at).fromNow();
//   else return formatTime(at);
// }

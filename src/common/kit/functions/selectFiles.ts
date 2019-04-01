export default function selectFiles(
  inputPropsSetter?: (input: HTMLInputElement) => void
): Promise<File[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.multiple = false;
    inputPropsSetter && inputPropsSetter(input);
    input.type = 'file';
    input.style.display = 'none';
    input.onchange = () => {
      if (input.files) {
        const files: File[] = [];
        for (let i = 0; i < input.files.length; i++) {
          files.push(input.files.item(i)!);
        }
        resolve(files);
      } else {
        reject();
      }
    };
    document.getElementsByTagName('html')!.item(0)!.appendChild(input);
    input.click();
  });
}

import Counter from "./Counter.js";
const counter = new Counter();

const initApp = () => {
  const droparea = document.querySelector(".droparea");
  const inputField = document.querySelector("#fileuploadx");

  const active = () => droparea.classList.add("green-border");

  const inactive = () => droparea.classList.remove("green-border");

  const prevents = (e) => e.preventDefault();

  ["dragover", "drop"].forEach((evtName) => {
    droparea.addEventListener(evtName, prevents);
    inputField.addEventListener(evtName, prevents);
  });

  ["dragenter", "dragover"].forEach((evtName) => {
    droparea.addEventListener(evtName, active);
    inputField.addEventListener(evtName, active);
  });

  ["dragleave", "drop"].forEach((evtName) => {
    droparea.addEventListener(evtName, inactive);
    inputField.addEventListener(evtName, inactive);
  });

  droparea.addEventListener("drop", handleDrop);
  inputField.addEventListener("change", handleDropx);
};

document.addEventListener("DOMContentLoaded", initApp);

const handleDropx = (e) => {
  const inputField = document.querySelector("#fileuploadx");

  const files = inputField.files;
  // alert(JSON.stringify(files));

  const fileArray = [...files];
  if (fileArray.length > 30) return alert("Too many files!");
  const legit = filterOutOverFourMbFiles(fileArray);
  handleFiles(legit);
  displayDownloadButtonForZip(legit.length);
};

const handleDrop = (e) => {
  const dt = e.dataTransfer;
  // alert(JSON.stringify(dt.files[0]));
  const files = dt.files;

  const fileArray = [...files];
  if (fileArray.length > 30) return alert("Too many files!");
  const legit = filterOutOverFourMbFiles(fileArray);
  handleFiles(legit);
  displayDownloadButtonForZip(legit.length);
};

const handleFiles = (fileArray) => {
  const expectedSizes = fileArray;
  expectedSizes.forEach((file) => {
    const fileID = counter.getValue();
    counter.incrementValue();
    showToast();
    // if (file.size > 4 * 1024 * 1024) alert("File over 4 MB");
    createResult(file, fileID);
    uploadFile(file, fileID);
  });
};

const createResult = (file, fileID) => {
  const origFileSizeString = getFileSizeString(file.size);

  const p1 = document.createElement("p");
  p1.className = "results__title";
  p1.textContent = file.name;

  const p2 = document.createElement("p");
  p2.className = "results__size";
  p2.textContent = origFileSizeString;

  const divOne = document.createElement("div");
  divOne.appendChild(p1);
  divOne.appendChild(p2);

  const progress = document.createElement("progress");
  progress.id = `progress_${file.name}_${fileID}`;
  progress.className = "results__bar";
  progress.max = 10;
  progress.value = 0;

  const p3 = document.createElement("p");
  p3.id = `new_size_${file.name}_${fileID}`;
  p3.className = "results__size";

  const p4 = document.createElement("p");
  p4.id = `download_${file.name}_${fileID}`;
  p4.className = "results__download";

  const p5 = document.createElement("p");
  p5.id = `saved_${file.name}_${fileID}`;
  p5.className = "results__saved";

  const divDL = document.createElement("div");
  divDL.className = "divDL";
  divDL.appendChild(p4);
  divDL.appendChild(p5);

  const divTwo = document.createElement("div");
  divTwo.appendChild(p3);
  divTwo.appendChild(divDL);

  const li = document.createElement("li");
  li.appendChild(divOne);
  li.appendChild(progress);
  li.appendChild(divTwo);

  document.querySelector(".results__list").appendChild(li);
  displayResults();
};

const getFileSizeString = (filesize) => {
  const sizeInKB = parseFloat(filesize) / 1024;
  const sizeInMB = sizeInKB / 1024;
  return sizeInKB > 1024
    ? `${sizeInMB.toFixed(1)} MB`
    : `${sizeInKB.toFixed(1)} KB`;
};

const displayResults = () => {
  const results = document.querySelector(".results");
  if (results.classList.contains("none")) {
    results.classList.remove("none");
    results.classList.add("block");
  }
};

const uploadFile = (file, fileID) => {
  const reader = new FileReader();
  reader.addEventListener("loadend", async (e) => {
    const filename = file.name;
    const base64String = e.target.result;
    const extension = filename.split(".").pop();
    const name = filename.slice(0, filename.length - (extension.length + 1));
    const body = { base64String, name, extension };
    const url =
      "https://tinycloneankurjain.netlify.app/.netlify/functions/compress_files";

    try {
      const fileStream = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const imgJson = await fileStream.json();
      if (imgJson.error) return handleFileError(filename, fileID);
      updateProgressBar(file, fileID, imgJson);
    } catch (err) {
      console.error(err);
    }
  });

  reader.readAsDataURL(file);
};

const handleFileError = (filename, fileID) => {
  const progress = document.getElementById(`progress_${filename}_${fileID}`);
  progress.value = 10;
  progress.classList.add("error");
};

const updateProgressBar = (file, fileID, imgJson) => {
  const progress = document.getElementById(`progress_${file.name}_${fileID}`);
  const addProgress = setInterval(() => {
    progress.value += 1;
    if (progress.value === 10) {
      clearInterval(addProgress);
      progress.classList.add("finished");
      populateResult(file, fileID, imgJson);
    }
  }, 50);
};

const populateResult = (file, fileID, imgJson) => {
  const newFileSizeString = getFileSizeString(imgJson.filesize);
  const percentSaved = getPercentSaved(file.size, imgJson.filesize);

  const newSize = document.getElementById(`new_size_${file.name}_${fileID}`);
  newSize.textContent = newFileSizeString;

  const download = document.getElementById(`download_${file.name}_${fileID}`);
  const link = createDownloadLink(imgJson);
  download.appendChild(link);

  const saved = document.getElementById(`saved_${file.name}_${fileID}`);
  saved.textContent = `???${Math.round(percentSaved)}%`;
};

const getPercentSaved = (origFileSize, newFileSize) => {
  const origFS = parseFloat(origFileSize);
  const newFS = parseFloat(newFileSize);
  return ((origFS - newFS) / origFS) * 100;
};

const createDownloadLink = (imgJson) => {
  const extension = imgJson.filename.split(".").pop();
  const link = document.createElement("a");
  link.href = `data:image/${extension};base64,${imgJson.base64CompString}`;
  link.download = imgJson.filename;
  link.textContent = "download";
  link.classList.add("downloadelement");
  return link;
};

const displayDownloadButtonForZip = (noOfUploaded) => {
  if (isCompressedEqualUploaded(noOfUploaded)) {
    document.querySelector("#zipdownloadbutton").style.display = "block";
  } else {
    setTimeout(() => {
      displayDownloadButtonForZip(noOfUploaded);
    }, 3000);
  }
};

const downloadZipOfCompressedImages = () => {
  const allDownloadLinkPresent = document.querySelectorAll(".downloadelement");
  const titles = document.querySelectorAll(".results__title");
  let stringTitles = htmlCollectionToArrOfStr(titles);
  var zip = new JSZip();
  allDownloadLinkPresent.forEach((downloadLink, index) => {
    zip.file(stringTitles[index], extractBase64String(downloadLink.href), {
      base64: true,
    });
  });

  zip.generateAsync({ type: "blob" }).then(function (content) {
    saveAs(content, "Optimized_Images.zip");
    // location.href = "data:application/zip;base64," + base64;
  });
};

document
  .querySelector("#zipdownloadbutton")
  .addEventListener("click", downloadZipOfCompressedImages);

const isCompressedEqualUploaded = (noOfUploaded) => {
  const NoOfDownloadLinkPresent =
    document.querySelectorAll(".downloadelement").length;
  return noOfUploaded == NoOfDownloadLinkPresent;
};

const htmlCollectionToArrOfStr = (arr) => {
  let arrOfStrings = [];
  arr.forEach((element) => {
    arrOfStrings.push(element.innerHTML);
  });
  return arrOfStrings;
};

const extractBase64String = (stringText) => {
  let newR = new RegExp(/^data:image\/(.*);base64,/, "i");
  return stringText.replace(newR, "");
};

const filterOutOverFourMbFiles = (files) => {
  const lessThanFourMb = [];
  files.forEach((file) => {
    if (file.size < 4 * 1024 * 1024) {
      lessThanFourMb.push(file);
    } else {
      alert("File over 4 MB");
    }
  });

  return lessThanFourMb;
};

function showToast() {
  var toast = document.getElementById("toast");
  toast.className = "show";
  setTimeout(function () {
    toast.className = toast.className.replace("show", "");
  }, 5000);
}

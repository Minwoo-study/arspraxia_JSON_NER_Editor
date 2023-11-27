// 전역 변수로 currentJson를 선언합니다.
let currentJson = null;

// 현재 선택된 셀의 위치를 저장할 변수
let selectedCellIndex = null;
let selectedRowIndex = null;

// 파일 이름을 저장하기 위한 전역 변수
let currentFileName = "";

function readJson(e) {
  try {
    // 파일 내용을 JSON으로 파싱하여 currentJson에 저장합니다.
    currentJson = JSON.parse(e.target.result);
    // 파일 업로드 후 UI를 업데이트하는 함수를 호출합니다.
    displayData(currentJson);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    alert('Invalid JSON file');
  }
}

/* 각 셀에 대해 수정 가능하게 만들고 수정 내용을 처리하는 함수*/
function makeCellEditable(cell) {
  // 셀을 수정 가능하게 만듭니다.
  cell.setAttribute('contenteditable', 'true');

  // Enter 키가 눌렸을 때의 이벤트 처리
  cell.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault(); // 기본 Enter 키의 개행 동작을 방지
      event.target.blur(); // blur 이벤트를 발생시켜 셀 수정을 종료
    }
  });

  // 셀에서 발생하는 'blur' 이벤트를 처리합니다.  
  cell.addEventListener('blur', function(event) {
    // 사용자가 수정을 완료하면 이벤트가 발생합니다.
    // 여기서 event.target.textContent를 사용하여 셀의 수정된 내용에 접근할 수 있습니다.
    let updatedContent = event.target.textContent;

    let articleIndex = event.target.closest('article').dataset.index;
    let cellIndex = Array.from(event.target.parentNode.children).indexOf(event.target);

    if (event.target.closest('.raw-data-row')) {
      // Raw_data 행 셀 수정 시 로직
      currentJson.data[articleIndex].Raw_data = currentJson.data[articleIndex].Raw_data.split(' ').map((word, index) => index === cellIndex ? updatedContent : word).join(' ');
    } else if (event.target.closest('.entities-list-row')) {
      // Entities_list 행 셀 수정 시 로직
      currentJson.data[articleIndex].Entities_list[cellIndex] = updatedContent;
      // 해당 Entities_list 셀의 볼드 스타일 변경
      if (updatedContent === "O") {
        event.target.classList.remove('bold');
        // 동일한 인덱스를 가진 Raw_data 셀의 볼드 스타일을 제거
        let correspondingRawDataCell = event.target.parentNode.previousElementSibling.children[cellIndex];
        correspondingRawDataCell.classList.remove('bold');
      } else {
        event.target.classList.add('bold');
        // 동일한 인덱스를 가진 Raw_data 셀에 볼드 스타일을 추가
        let correspondingRawDataCell = event.target.parentNode.previousElementSibling.children[cellIndex];
        correspondingRawDataCell.classList.add('bold');
      }
    }
    
    // 수정된 내용은 자동으로 ui에 반영되므로 따로 displayData 함수를 호출할 필요가 없습니다.
  });
}

// 표 수정 인터랙션 바를 표시하는 함수
function showInteractionBar(cell) {
  let bar = document.getElementById('interaction-bar');

  // 인터랙션 바의 위치를 클릭된 셀 위에 맞춥니다.
  const cellRect = cell.getBoundingClientRect();

  // 인터랙션 바의 x좌표를 셀의 중앙에 맞춥니다.
  // 인터랙션 바를 셀의 상단에 위치시킵니다. 
  // 셀의 top 위치에서 인터랙션 바의 높이와 스크롤 위치를 고려합니다.
  const barLeft = cellRect.left + (cellRect.width / 2) - (bar.offsetWidth / 2);
  const barTop = cellRect.top + window.scrollY - bar.offsetHeight;

  bar.style.top = barTop + 'px';
  bar.style.left = barLeft + 'px';

  bar.classList.remove('hidden');
}

function makeCellInsertable(cell, index) {
  // 셀을 선택하면 양옆을 선택해 열 추가를 할 수 있게 합니다.
  cell.addEventListener('click', function(event) {
    const rowIndex = event.target.closest('article').dataset.index;
    selectCell(rowIndex, index); // rowIndex는 현재 행의 인덱스
    showInteractionBar(event.target);
    event.stopPropagation(); // 이벤트 버블링을 방지합니다.
  });
}

// 새 열을 추가하는 함수
function insertColumn(rowIndex, cellIndex, direction) {
  let rawRow = currentJson.data[rowIndex].Raw_data.split(' ');
  let entitiesRow = currentJson.data[rowIndex].Entities_list;

  // 왼쪽 또는 오른쪽에 따라 새 열 삽입 위치 결정
  let insertAt = direction === 'left' ? cellIndex : cellIndex + 1;

  // Raw_data 행과 Entities_list 행에 새 열 삽입
  rawRow.splice(insertAt, 0, '-');
  entitiesRow.splice(insertAt, 0, 'O');

  // currentJson 객체 업데이트
  currentJson.data[rowIndex].Raw_data = rawRow.join(' ');
  currentJson.data[rowIndex].Entities_list = entitiesRow;

  // UI 업데이트
  displayData(currentJson);
}

// 셀을 클릭할 때 선택된 셀의 인덱스를 저장하는 함수
function selectCell(rowIndex, cellIndex) {
  selectedRowIndex = rowIndex;
  selectedCellIndex = cellIndex;
}

// displayData 함수는 currentJson를 사용하여 UI를 구성합니다.
function displayData(currentJson) {
  // 여기에 UI를 업데이트하는 코드가 들어갑니다.
  // 예를 들어, 각 data-block을 생성하고 currentJson의 내용을 표시합니다.
  const editorContainer = document.getElementById('editor-container');
  editorContainer.innerHTML = ''; // Clear previous data

  currentJson.data.forEach((item, index) => {
    const articleBlock = document.createElement('article');
    articleBlock.dataset.index = index;
    articleBlock.className = 'data-block';
    articleBlock.setAttribute('data-theme', 'light');

    // Display Sen_ID
    const senIdDiv = document.createElement('div');
    senIdDiv.className = 'sen-id';
    let sentenceId = item.Sen_ID;
    if (item.Sen_ID === undefined) {sentenceId = item.SEN_ID}
    senIdDiv.textContent = `Sen_ID: ${sentenceId}`;
    // 예외처리 : Sen_ID가 undefined일 경우, 대신 SEN_ID를 표시
    articleBlock.appendChild(senIdDiv);

    // Create a scrollable table for Raw_data and Entities_list
    const tableDiv = document.createElement('div');
    tableDiv.className = 'scrollable-table';

    // Create table row for words and apply bold style if the entity is not "O"
    const wordsRow = document.createElement('div');
    wordsRow.className = 'table-row';
    wordsRow.classList.add('raw-data-row')
    item.Raw_data.split(' ').forEach((word, index) => {
      const wordCell = document.createElement('span');
      wordCell.className = 'table-cell';
      wordCell.textContent = word;
      // If the entity at this index is not "O", make the text bold
      if (item.Entities_list[index] !== "O") {
          wordCell.classList.add('bold');
      }
      wordsRow.appendChild(wordCell);
      });
    tableDiv.appendChild(wordsRow);

    // Create table row for entities and apply bold style if the entity is not "O"
    const entitiesRow = document.createElement('div');
    entitiesRow.className = 'table-row';
    entitiesRow.classList.add('entities-list-row')
    item.Entities_list.forEach((entity, index) => {
      const entityCell = document.createElement('span');
      entityCell.className = 'table-cell';
      entityCell.textContent = entity;
      // If the entity is not "O", make the text bold
      if (entity !== "O") {
          entityCell.classList.add('bold');
      }
      entitiesRow.appendChild(entityCell);
      });
    tableDiv.appendChild(entitiesRow);

    articleBlock.appendChild(tableDiv);
    editorContainer.appendChild(articleBlock);
  });

  document.querySelectorAll('.table-cell').forEach(makeCellEditable);
  document.querySelectorAll('.table-cell').forEach(makeCellInsertable);
}

function makeEntityData(rawData, entitiesList) {
  let entityData = [];
  let currentEntity = null;

  rawData.split(' ').forEach((token, i) => {
    let entityTag = entitiesList[i];

    if (entityTag !== 'O') {
      // 개체명 클래스와 타입 (B/I)을 분리합니다.
      let parts = entityTag.split('-');
      const entType = parts.pop();
      const entClass = parts.join('-');

      if (entType === 'B') {
        // 새로운 개체명이 시작되었습니다.
        if (currentEntity) {
          // 이전 개체명 정보를 저장합니다.
          entityData.push(currentEntity);
        }
        // 새 개체명 정보를 초기화합니다.
        currentEntity = {
          entity: token,
          entityClass: entClass,
          entityStart: i,
          entityEnd: i
        };
      } else if (entType === 'I' && currentEntity && entClass === currentEntity.entityClass) {
        // 이전 개체명이 계속되고 있습니다.
        currentEntity.entity += " " + token;
        currentEntity.entityEnd = i;
      }
    } else {
      // 개체명이 끝났습니다.
      if (currentEntity) {
        entityData.push(currentEntity);
        currentEntity = null;
      }
    }
  });

  // 마지막 개체명이 있다면 추가합니다.
  if (currentEntity) {
    entityData.push(currentEntity);
  }

  return entityData;
}

// 버튼을 이용한 파일 업로드 시 이벤트 (파일 업로드)
document.getElementById('file-input').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = readJson;
    reader.readAsText(file);
  };
});

// 파일 끌어오기 시 이벤트 (파일 업로드)
document.body.addEventListener('drop', function(event) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file) {
    // 파일 입력 인터페이스를 업데이트합니다.
    document.getElementById('file-input').files = event.dataTransfer.files;
    
    // 파일이 드래그 앤 드롭으로 업로드된 경우 메시지를 숨깁니다.
    document.getElementById('file-drag-message').style.display = 'none';

    const reader = new FileReader();
    reader.onload = readJson;
    reader.readAsText(file);
  }
});

// Optional: Handle drag and drop
document.body.addEventListener('dragover', function(event) {event.preventDefault();});

// 새로 파일이 업로드되었을 경우 파일명 최신화하고 안내 메시지 숨김
document.getElementById('file-input').addEventListener('change', function(event) {
  if (event.target.files.length > 0) {
    currentFileName = event.target.files[0].name; // 현재 파일 이름 저장
    // 파일 선택시 메시지 숨김
    document.getElementById('file-drag-message').style.display = 'none';
  }
});

// export 실행 시
document.getElementById('export-button').addEventListener('click', function() {

  // currentJson을 가져오고 data의 각 요소의 Raw_data, Entities_list에 대해 makeEntityData 함수를 실행하여 entityData를 생성
  // 생성한 entityData를 currentJson.data의 각 요소의 Entities에 할당
  // currentJson.data의 각 요소의 NER_Count에 entityData의 길이를 할당
  // Entities_list 길이에 따라 Word_Count 업데이트

  currentJson.data.forEach(item => {
    let entityData = makeEntityData(item.Raw_data, item.Entities_list);
    item.Word_Count = item.Entities_list.length;
    item.Entities = entityData;
    item.NER_Count = entityData.length;
  });

  // TODO : Word_Count를 구해 업데이트, entityData의 길이와 Raw_data의 길이가 일치하지 않을 경우 경고 출력
  
  // Blob 객체 생성 및 URL 생성
  const blob = new Blob([JSON.stringify(currentJson, null, 2)], {type : 'application/json'});
  const url = URL.createObjectURL(blob);
  
  // 임시 링크 생성 및 클릭 이벤트 실행
  const a = document.createElement('a');
  a.href = url;
  a.download = currentFileName || "exportedData.json"; // 현재 파일 이름을 사용
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Blob URL 정리
  URL.revokeObjectURL(url);
});


// 열 추가 버튼 / 인터랙션 바 관련 이벤트

// 문서의 다른 부분을 클릭하면 인터랙션 바를 숨깁니다.
document.addEventListener('click', function(event) {
  if (!event.target.matches('.table-cell')) {
    document.querySelectorAll('#interaction-bar').forEach(bar => {
      bar.classList.add('hidden');
    });
  }
});

document.getElementById('insert-left').addEventListener('click', function() {
  // 현재 활성화된 셀의 인덱스를 찾아 왼쪽에 새로운 셀을 추가합니다.
  // 여기에 왼쪽 셀 추가 로직을 구현합니다.
  if (selectedCellIndex !== null) {
    insertColumn(selectedRowIndex, selectedCellIndex, 'left');
  }
});

document.getElementById('insert-right').addEventListener('click', function() {
  // 현재 활성화된 셀의 인덱스를 찾아 오른쪽에 새로운 셀을 추가합니다.
  // 여기에 오른쪽 셀 추가 로직을 구현합니다.
  if (selectedCellIndex !== null) {
    insertColumn(selectedRowIndex, selectedCellIndex, 'right');
  }
});


// TODO: Add more interactive features, like editing entities and saving changes
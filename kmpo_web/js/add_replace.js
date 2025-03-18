// Dropdown для вариантов заполнения.
document.addEventListener('DOMContentLoaded', function () {
    const fields = ['group', 'oldTeacher', 'oldDiscipline', 'newTeacher', 'newDiscipline'];

    fields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        const dropdown = document.createElement('div');
        dropdown.className = 'autocomplete-dropdown hidden';
        input.parentNode.appendChild(dropdown);

        input.addEventListener('input', async function () {
            const query = input.value.trim();
            if (query.length < 2) {
                dropdown.classList.add('hidden')
                dropdown.innerHTML = '';
                return;
            }
            else{
                dropdown.classList.remove('hidden')
            }

            try {
                const response = await fetch(`functions/get_suggestions.php?field=${fieldId}&query=${query}`);
                if (!response.ok) throw new Error('Ошибка при загрузке данных');
                const data = await response.json();

                dropdown.innerHTML = '';
                data.forEach(item => {
                    const option = document.createElement('div');
                    option.className = 'autocomplete-option';
                    option.textContent = item;
                    option.addEventListener('click', function () {
                        input.value = item;
                        dropdown.innerHTML = '';
                    });
                    dropdown.appendChild(option);
                });
            } catch (error) {
                console.error('Ошибка:', error);
            }
        });
    });
});

// Обрабтка данных формы
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('replacementForm');

    // Проверка корректности заполненных данных
    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const fieldsToCheck = [
            { id: 'group', table: 'groups', field: 'name', rus: 'Группа' },
            { id: 'oldTeacher', table: 'teachers', field: 'name', rus: '[Было] Преподаватель' },
            { id: 'oldDiscipline', table: 'disciplines', field: 'name', rus: '[Было] Дисциплина'  },
            { id: 'newTeacher', table: 'teachers', field: 'name', rus: '[Стало] Преподаватель'   },
            { id: 'newDiscipline', table: 'disciplines', field: 'name', rus: '[Стало] Дисциплина'   },
            { id: 'oldPair', table: 'slots', field: 'id', rus: '[Было] Пара' },
            { id: 'newPair', table: 'slots', field: 'id', rus: '[Стало] Пара' },
        ];

        let isValid = true;

        const date = document.getElementById('date').value.trim();
        today = new Date().toISOString().split('T')[0];
        if (date < today) {
            alert('Дата не может быть раньше текущей.');
            isValid = false;
        }

        for (const field of fieldsToCheck) {
            const input = document.getElementById(field.id);
            const value = input.value.trim();

            if (value) {
                const response = await fetch(`functions/check_value.php?table=${field.table}&field=${field.field}&value=${value}`);
                const exists = await response.json();

                if (!exists) {
                    alert(`Значение "${value}" не найдено в базе данных для поля "${field.rus}".`);
                    isValid = false;
                    break;
                }
            }
        }

        // Проверка занятости кабинета.
        const newPair = document.getElementById('newPair').value
        const group = document.getElementById('group').value

        const newRoom = document.getElementById('newRoom').value
        const response = await fetch(`functions/check_replace.php?type=room&value=${newRoom}&date=${date}&newPair=${newPair}`);
        const exists = await response.json();
        console.log(exists)
        if (exists) {
            const isConfirmed = confirm(`Кабинет ${newRoom} уже занят следующей парой:\n\nДата и время: ${date}, ${exists['slot_id']} пара\nГруппа: ${exists['name']}\nДисциплина: ${exists['discipline_name']}\nПреподаватель: ${exists['teacher_fullname']}\n\nВы уверены, что хотите продолжить и поставить эту замену для группы ${group}?`);
            isValid = isConfirmed;
        }

 
  
        if (isValid) {
            alert('Форма отправлена!')
            // submitForm();
        }
    });

    // Отправка данных формы на файл-обработчик
    async function submitForm() {
        const formData = new FormData(form);

        try {
            const response = await fetch('functions/save_replacement.php', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Ошибка при отправке данных');
            const result = await response.json();

            if (result.success) {
                alert('Замена успешно добавлена!');
                form.reset();
            } else {
                alert('Ошибка: ' + result.message);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при отправке формы.');
        }
    }
});
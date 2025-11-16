import os
from cryptography.fernet import Fernet

# Получаем ключ из переменной окружения
key = os.getenv('SESSION_KEY')
if not key:
    raise Exception('SESSION_KEY не задана в переменных окружения!')
f = Fernet(key.encode())

# Дешифрование файла
with open('railway_production.session.enc', 'rb') as file:
    decrypted = f.decrypt(file.read())
with open('railway_production.session', 'wb') as file:
    file.write(decrypted)

print('Файл railway_production.session успешно расшифрован!')

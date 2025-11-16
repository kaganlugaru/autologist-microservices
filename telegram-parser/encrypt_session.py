from cryptography.fernet import Fernet

# Генерация ключа и сохранение его в файл
key = Fernet.generate_key()
with open('session.key', 'wb') as key_file:
    key_file.write(key)

# Шифрование файла сессии
f = Fernet(key)
with open('railway_production.session', 'rb') as file:
    encrypted = f.encrypt(file.read())
with open('railway_production.session.enc', 'wb') as file:
    file.write(encrypted)

print('Файл railway_production.session зашифрован!')
print('Ключ сохранён в session.key (не передавайте его публично!)')
print('Для расшифровки используйте decrypt_session.py')

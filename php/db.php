<?php
$host = "email_db.mysql.dbaas.com.br";  // normalmente "localhost"
$usuario = "email_db";  // Substitua pelo seu usuário
$senha = "Adrn@#474550#@";  // Substitua pela sua senha
$banco = "email_db";  // O nome do seu banco de dados

// Conectar ao banco de dados MySQL
$conn = new mysqli($host, $usuario, $senha, $banco);

if ($conn->connect_error) {
    die("Conexão falhou: " . $conn->connect_error);
}
?>

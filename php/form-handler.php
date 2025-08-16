<?php
// Incluir a conexão com o banco de dados
include('db.php');

// Função para sanitizar dados
function sanitize_input($data) {
    // Remove espaços em branco no início e fim e converte caracteres especiais em HTML
    return htmlspecialchars(trim($data));
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Verificar o campo honeypot
    if (!empty($_POST['honeypot'])) {
        // Se o campo "honeypot" não estiver vazio, é um bot
        exit("Erro de envio. Tente novamente.");
    }

    // Sanitizar e pegar o e-mail do formulário
    $email = sanitize_input($_POST['email']);

    // Verificar se o e-mail é válido
    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        
        // Validar que o e-mail não contenha caracteres suspeitos ou inválidos
        if (preg_match('/[^a-zA-Z0-9@._-]/', $email)) {
            echo "O e-mail contém caracteres inválidos.";
            exit;
        }

        // Preparar a consulta SQL com Prepared Statement
        $stmt = $conn->prepare("INSERT INTO emails (email) VALUES (?)");

        // Verificar se a preparação da consulta foi bem-sucedida
        if ($stmt === false) {
            echo "Erro na preparação da consulta: " . $conn->error;
            exit;
        }

        // Associar o parâmetro da consulta (s = string)
        $stmt->bind_param("s", $email);

        // Executar a consulta
        if ($stmt->execute()) {
            echo "Obrigado! Você será notificado assim que lançarmos.";
        } else {
            echo "Erro ao salvar o e-mail: " . $stmt->error;
        }

        // Fechar o statement
        $stmt->close();
    } else {
        echo "Por favor, insira um e-mail válido.";
    }
}

// Fechar a conexão com o banco de dados
$conn->close();
?>
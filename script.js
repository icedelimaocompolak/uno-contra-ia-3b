
const colors = ["red", "blue", "green", "yellow"];

let deck = [];
let playerHand = [];
let aiHand = [];
let discardPile = [];

let currentPlayer = "player";
let currentColor = "";
let gameActive = false;
let waitingColor = false;
let pendingDraw = 0;

function createDeck() {
    deck = [];

    colors.forEach(color => {

        for (let n = 0; n <= 9; n++) {
            deck.push({ color, value: n });
        }

        ["Bloquear", "Inverter", "+2"].forEach(value => {
            deck.push({ color, value });
        });

    });

    for (let i = 0; i < 4; i++) {
        deck.push({ color: "wild", value: "Coringa" });
        deck.push({ color: "wild", value: "+4" });
    }

    deck.sort(() => Math.random() - 0.5);
}

function drawCard(hand) {
    if (deck.length === 0) {
        if (discardPile.length <= 1) return;

        const top = discardPile.pop();
        deck = discardPile.splice(0);
        discardPile = [top];

        deck.sort(() => Math.random() - 0.5);
    }

    if (deck.length > 0) {
        hand.push(deck.pop());
    }
}

function startGame() {

    createDeck();

    playerHand = [];
    aiHand = [];
    discardPile = [];

    for (let i = 0; i < 7; i++) {
        drawCard(playerHand);
        drawCard(aiHand);
    }

    let firstCard;

    do {
        firstCard = deck.pop();
    } while (firstCard.color === "wild");

    discardPile.push(firstCard);

    currentColor = firstCard.color;
    currentPlayer = "player";
    pendingDraw = 0;
    waitingColor = false;
    gameActive = true;

    document.getElementById("gameOver").style.display = "none";
    document.getElementById("colorPicker").style.display = "none";

    renderGame();

    document.getElementById("turnInfo").textContent = "Sua vez!";
    document.getElementById("gameMessage").textContent =
        "Escolha uma carta para jogar!";
}

function renderCard(card, clickable, index) {

    const element = document.createElement("div");

    element.className = `uno-card ${card.color}`;
    element.textContent = card.value;

    if (clickable) {
        element.addEventListener("click", () => {
            playCard(index);
        });
    }

    return element;
}

function renderGame() {

    const playerArea = document.getElementById("playerCards");
    const aiArea = document.getElementById("aiCards");

    playerArea.innerHTML = "";
    aiArea.innerHTML = "";

    playerHand.forEach((card, index) => {
        playerArea.appendChild(renderCard(card, true, index));
    });

    aiHand.forEach(() => {
        const back = document.createElement("div");
        back.className = "card-back";
        back.textContent = "UNO";
        aiArea.appendChild(back);
    });

    document.getElementById("playerCount").textContent =
        playerHand.length;

    document.getElementById("aiCount").textContent =
        aiHand.length;

    const top = discardPile[discardPile.length - 1];

    const topCard = document.getElementById("topCard");
    topCard.innerHTML = "";

    topCard.appendChild(renderCard(top, false));

    if (top.color === "wild") {
        topCard.firstChild.style.background =
            `linear-gradient(135deg, #e63946 25%, #2878d0 25% 50%, #229954 50% 75%, #f1c40f 75%)`;
    }
}

function isPlayable(card) {

    const top = discardPile[discardPile.length - 1];

    if (pendingDraw > 0) {
        return card.value === "+2" ||
               (card.color === "wild" && card.value === "+4");
    }

    return card.color === "wild" ||
           card.color === currentColor ||
           card.value === top.value;
}

function playCard(index) {

    if (!gameActive || currentPlayer !== "player" ||
        waitingColor || !playerHand[index]) return;

    const card = playerHand[index];

    if (!isPlayable(card)) {
        document.getElementById("gameMessage").textContent =
            "Essa carta não pode ser jogada!";
        return;
    }

    playerHand.splice(index, 1);
    discardPile.push(card);

    if (card.color !== "wild") {
        currentColor = card.color;
    }

    renderGame();

    if (playerHand.length === 0) {
        endGame("🏆 VOCÊ VENCEU!");
        return;
    }

    if (card.color === "wild") {
        waitingColor = true;
        document.getElementById("colorPicker").style.display = "block";
        document.getElementById("gameMessage").textContent =
            "Escolha uma cor!";
        return;
    }

    applyEffect(card, "player");
}

function applyEffect(card, owner) {

    if (card.value === "+2") {
        pendingDraw += 2;
    }

    if (card.value === "+4") {
        pendingDraw += 4;
    }

    if (card.value === "Bloquear" ||
        card.value === "Inverter") {
        // Em uma partida com dois jogadores, pula o adversário.
        if (owner === "player") {
            currentPlayer = "player";
            setTimeout(aiTurn, 700);
            return;
        } else {
            currentPlayer = "ai";
            setTimeout(playerTurn, 700);
            return;
        }
    }

    if (owner === "player") {
        currentPlayer = "ai";
        setTimeout(aiTurn, 900);
    } else {
        currentPlayer = "player";
        setTimeout(playerTurn, 900);
    }
}

document.querySelectorAll(".color-picker button").forEach(button => {

    button.addEventListener("click", () => {

        if (!waitingColor || !gameActive) return;

        currentColor = button.dataset.color;

        waitingColor = false;

        document.getElementById("colorPicker").style.display = "none";

        const card = discardPile[discardPile.length - 1];

        applyEffect(card, "player");

        renderGame();
    });

});

function aiTurn() {

    if (!gameActive) return;

    currentPlayer = "ai";

    document.getElementById("turnInfo").textContent =
        "🤖 Vez da IA";

    document.getElementById("gameMessage").textContent =
        "O computador está pensando...";

    setTimeout(() => {

        if (!gameActive) return;

        if (pendingDraw > 0) {
            for (let i = 0; i < pendingDraw; i++) {
                drawCard(aiHand);
            }

            pendingDraw = 0;

            currentPlayer = "player";
            renderGame();
            playerTurn();
            return;
        }

        const validIndex = aiHand.findIndex(card => isPlayable(card));

        if (validIndex !== -1) {

            const card = aiHand.splice(validIndex, 1)[0];

            discardPile.push(card);

            if (card.color === "wild") {
                currentColor = colors[
                    Math.floor(Math.random() * colors.length)
                ];
            } else {
                currentColor = card.color;
            }

            if (aiHand.length === 0) {
                renderGame();
                endGame("🤖 A IA venceu!");
                return;
            }

            renderGame();
            applyEffect(card, "ai");

        } else {

            drawCard(aiHand);

            renderGame();

            const newIndex = aiHand.length - 1;

            if (isPlayable(aiHand[newIndex])) {

                const card = aiHand.splice(newIndex, 1)[0];

                discardPile.push(card);

                if (card.color === "wild") {
                    currentColor = colors[
                        Math.floor(Math.random() * colors.length)
                    ];
                } else {
                    currentColor = card.color;
                }

                if (aiHand.length === 0) {
                    renderGame();
                    endGame("🤖 A IA venceu!");
                    return;
                }

                renderGame();
                applyEffect(card, "ai");

            } else {
                currentPlayer = "player";
                playerTurn();
            }
        }

    }, 1000);
}

function playerTurn() {

    if (!gameActive) return;

    currentPlayer = "player";

    document.getElementById("turnInfo").textContent =
        "Sua vez! 🎮";

    document.getElementById("gameMessage").textContent =
        "Escolha uma carta para jogar!";
}

document.getElementById("drawButton").addEventListener("click", () => {

    if (!gameActive || currentPlayer !== "player" ||
        waitingColor) return;

    if (pendingDraw > 0) {

        for (let i = 0; i < pendingDraw; i++) {
            drawCard(playerHand);
        }

        pendingDraw = 0;

        renderGame();

        currentPlayer = "ai";
        aiTurn();

        return;
    }

    drawCard(playerHand);

    renderGame();

    document.getElementById("gameMessage").textContent =
        "Você comprou uma carta!";

    currentPlayer = "ai";

    setTimeout(aiTurn, 900);
});

function endGame(message) {

    gameActive = false;

    document.getElementById("finalMessage").textContent = message;

    document.getElementById("gameOver").style.display = "flex";
}

function restartGame() {
    startGame();
}

startGame();

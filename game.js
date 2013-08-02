//Alex Wilson
//May 2013 
var game_board;//current game state
var next_move;//indicates if X or O plays next
var AI_move;
var max_depth;
var size; 
//(function (exports) {
    window.onload = function() {
        changeSize(3); 
        $("#new_game").click(displaySetup);
        $("#boardSizeGo").click(function(){
            var boardSize =  document.getElementById("boardSize").selectedIndex + 3;
            changeSize(boardSize); 
        });
    }
    function changeSize(newSize) {
        size = newSize; 
        displaySetup();
    }
    function displaySetup() {
        next_move="X";
        setBoard();
        //clears old game squares
        $('#game').empty();
        for (var i=0; i<size; i++) {
            for (var j=0; j<size; j++) {
                //vars for id, top offset, and left offset based on size
                var id = 'sq' + i + '_' + j; 
                var tp = 300/size*i + 'px';
                var lft = 300/size*j + 'px';
                var fSize = 72 - 8 * size; 
                //creates elements, positions them, assigns click function
                $('<div/>', {
                    'id' : id
                }).appendTo($('#game'))
                .css({
                    'top' : tp,
                    'left' : lft,
                    'height' : 300/size-2,
                    'width' : 300/size-2,
                    'position' : 'absolute',
                    'font-size' : fSize + 'px'
                })
                .one("click", function (ii, jj) {
                    //creates a nifty little function so the id/position is preserved
                    return function () {
                        if ($(this).text() == "") {
                            move(game_board,next_move,jj,ii);
                            opponent_move();
                        }
                    }
                }(i, j));
            }
        }
    }
    function setBoard () {
        game_board = new Array(size);
        for (var j=0; j<size; j++) {
            game_board[j]=new Array(size);
            for (var i=0; i<size; i++) {
                game_board[j][i]='-'; 
            }
        }
    }

    //updates current game state and updates display also
    function move(game_state, player, column, row) {
        $("#sq" + row + "_" + column).text(next_move);
        $("#sq" + row + "_" + column).addClass(next_move);

        game_state[row][column]=player; 		
        if(player=="X")
            next_move="O";
        if(player=="O")
            next_move="X";
        if(game_over(game_state))
            alert("Game Over: " + game_result(game_state));
    }
    //fake move function so actual game board doesn't get changed
    function pseudo_move(gs, player, column, row) {
        gs[row][column]=player;
        return gs; 
    }
    //selects opponent strategy based on drop-down menu selection
    function opponent_move() {
        if(game_over(game_board))
            return;
        if(document.getElementById("opponents").selectedIndex==1) {
            //easy AI = picks random square to play in
            var moves = available_moves(game_board); 
            AI_move=moves[Math.floor(Math.random()*moves.length)];
            move(game_board, next_move, AI_move[1], AI_move[0]);
        }
        if(document.getElementById("opponents").selectedIndex==2) {
            //medium AI uses the minimax algorithm but doesn't look many moves in advance
            max_depth=2; 
            minimax((next_move=="X" ? 1 : -1), game_board, 0, -99999, 99999);
            move(game_board, next_move, AI_move[1], AI_move[0]);
        }
        if(document.getElementById("opponents").selectedIndex==3) {
            //hard_AI is a really good AI player who uses the minimax algorithm
            max_depth=9-size; 
            minimax((next_move=="X" ? 1 : -1), game_board, 0, -99999, 99999); 
            move(game_board, next_move, AI_move[1], AI_move[0]);
        }
    }
    function minimax(player, board, depth, alpha, beta) {
        var best_move;
        //if past cutoff depth or game is over, return game board score			
        if(game_over(board) || depth>max_depth)
            return newScore(board)*player;	
        var moves = available_moves(board);
        for (var i=0; i<moves.length; i++) {
            var current_board=$.extend(true, {}, board);
            var future_board=pseudo_move(current_board, (player==1 ? "X" : "O"), moves[i][1], moves[i][0]); 
            var minimax_results= -minimax(-player, future_board, depth+1, -beta, -alpha); 
            if(minimax_results>alpha){
                best_move=moves[i]; 
                alpha=minimax_results; 
            }
            if (depth==0)
                AI_move=best_move;
            if (beta<=alpha)
                break; 				
        }
        return (alpha); 
    };

    //returns list of all valid moves
    function available_moves(board){
        var valid_moves=[];
        for (var i_row=0; i_row<size; i_row++) {
            for (var i_col=0; i_col<size; i_col++) {
                if(board[i_row][i_col]=="-"){
                    valid_moves.push([i_row, i_col]);	
                }
            }	
        }
        return valid_moves;	
    };
    //returns array of 2*size+2 (all lines) with the number of [X/O] in each line 
    function counts(board, playerSymbol) {
        var count = Array.apply(null, new Array(2*size+2)).map(Number.prototype.valueOf,0);
        for (var j=0; j<size; j++) {
            for (var i=0; i<size; i++) {
            if(board[i][j]==playerSymbol)
                count[j]++;
            if(board[j][i]==playerSymbol)
                count[j+size]++;		
            if(i==j && board[i][j]==playerSymbol)
                count[2*size]++;
            if(i==size-1-j && board[i][j]==playerSymbol)
                count[2*size+1]++;
            }
        }
        return count;	
    };
    //returns true if playerSymbol has boardSize in a row in any row
    function playerWon(board, playerSymbol) {
        var count = counts(board, playerSymbol);
        return (Math.max.apply(null, count)==size);
    };

    //if x wins or o wins or there are now moves left(tie), returns true
    function game_over(board) {
        return playerWon(board, "X") || playerWon(board, "O") || available_moves(board).length === 0;
    };
    //to handle result messages
    function game_result(board) {
        if (playerWon(board, "X"))
            return "X Wins!";
        if (playerWon(board, "O"))
            return "O Wins!";
        if (available_moves(board).length==0)
            return "Tie Game";
    };

    //calculates total_score of given game board by counting x's and o's in each line, then evaluating the score of each line
    function newScore(board) {
        var o_counts = counts(board, "O");
        var x_counts = counts(board, "X"); 
        var score=0; 	
        for (var k=0; k<2*size+2; k++) {
            score +=newLineScore(x_counts[k], o_counts[k]);
        }
        return score;
    }
    //calculates the score of a single line by comparing number of x's and number of o's in each 
    function newLineScore(xcount,ocount){
        if (xcount==0 && ocount==0)
            return 0;
        if (xcount==0)
        return Math.pow(10,ocount)*(-1);
        if (ocount==0)
            return Math.pow(10,xcount);
        return 0; 
    }

exports.move=move; 
exports.minimax=minimax;
//}); 

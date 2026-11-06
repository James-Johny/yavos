class Linha {
    constructor(numero, setor) {
        this.numero = numero;
        this.setor = setor;
        this.colaboradores = [];
    }

    alocar(colaborador) {
        
        const alocado = this.colaboradores.some(c => c.matricula === colaborador.matricula);
        if (!alocado) {
            this.colaboradores.push(colaborador);
            return `${colaborador.nome.split(' ')[0]} alocado com sucesso nesta linha.`;
        } else {
            return `${colaborador.nome.split(' ')[0]} já alocado nesta linha.`;
        }
    }

    realocar(colaborador, destino) {
        const index = this.colaboradores.findIndex(c => c.matricula === colaborador.matricula);
        if (index !== -1) {
            this.colaboradores.splice(index, 1);
            destino.alocar(colaborador);
            return `${colaborador.nome.split(' ')[0]} realocado para a linha ${destino.numero}.`;
        } else {
            return `${colaborador.nome.split(' ')[0]} não encontrado nesta linha.`;
        }
    }

    modAlocada() {
        return this.colaboradores;
    }
}

class Colaborador {
    constructor(nome, cargo, setor, matricula, funcao) {
        this.nome = nome;        
        this.cargo = cargo;
        this.setor = setor;
        this.matricula = matricula;
        this.funcao = funcao;
    }

  

}


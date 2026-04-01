// Controle de passos
let step = 0;
const steps = document.querySelectorAll(".step");
let ultimoResultado = null;

function showStep() {
    steps.forEach((s, i) => s.classList.toggle("active", i === step));
}

function nextStep() {
    step++;
    if (step >= steps.length) step = steps.length - 1;
    showStep();
    if (step === steps.length - 1) calcular();
}

function prevStep() {
    step--;
    if (step < 0) step = 0;
    showStep();
}

// Calculo simplificado
function calcular() {
    const regime = document.getElementById("regime").value;
    const tipo = document.getElementById("tipo").value;
    const temICMS = document.getElementById("temICMS").value;
    const temST = document.getElementById("temST").value;
    const pis = document.getElementById("pis").value;

    let alerta = "";

    function gerar(isContribuinte, interna) {
        let cfop = "";
        let cstIcms = "";
        let base = 100;
        let icms = 18;
        let pisPerc = 1.65;
        let cofinsPerc = 7.6;
        let cstPis = "01";
        let cstCofins = "01";

        if (tipo === "venda") cfop = interna ? "5.102" : "6.102";
        if (tipo === "devolucao") cfop = "1.202";

        if (regime === "simples") {
            cstIcms = temST === "sim" ? "500" : "102";
            icms = 0;
            cstPis = "49";
            cstCofins = "49";
            pisPerc = 0;
            cofinsPerc = 0;
            alerta = "Simples Nacional: impostos nao destacados na nota.";
        } else {
            if (temICMS === "sim") cstIcms = "00";
            else if (temICMS === "isento") {
                cstIcms = "40";
                icms = 0;
            } else {
                cstIcms = "41";
            }

            if (temST === "sim") {
                cstIcms = "10";
                base = 140;
            }

            if (pis === "monofasico") {
                cstPis = "04";
                cstCofins = "04";
                pisPerc = 0;
                cofinsPerc = 0;
            }

            if (pis === "isento") {
                cstPis = "07";
                cstCofins = "07";
                pisPerc = 0;
                cofinsPerc = 0;
            }
        }

        return {
            contribuinte: isContribuinte ? "Contribuinte" : "Nao contribuinte",
            destino: interna ? "Dentro do estado" : "Fora do estado",
            cfop,
            cst_icms: cstIcms,
            cst_pis: cstPis,
            cst_cofins: cstCofins,
            base_icms: base,
            icms,
            pis: pisPerc,
            cofins: cofinsPerc
        };
    }

    ultimoResultado = {
        filtros: {
            regime,
            tipo,
            temICMS,
            temST,
            pis
        },
        alerta,
        cenarios: {
            contrib_interna: gerar(true, true),
            contrib_externa: gerar(true, false),
            nao_interna: gerar(false, true),
            nao_externa: gerar(false, false)
        }
    };

    document.getElementById("res_contrib_interna").innerHTML = formatarResultado(ultimoResultado.cenarios.contrib_interna);
    document.getElementById("res_contrib_externa").innerHTML = formatarResultado(ultimoResultado.cenarios.contrib_externa);
    document.getElementById("res_nao_interna").innerHTML = formatarResultado(ultimoResultado.cenarios.nao_interna);
    document.getElementById("res_nao_externa").innerHTML = formatarResultado(ultimoResultado.cenarios.nao_externa);
    document.getElementById("alerta").innerText = alerta;
}

function formatarResultado(resultado) {
    return `
CFOP: ${resultado.cfop}<br>
CST ICMS: ${resultado.cst_icms}<br>
CST PIS: ${resultado.cst_pis}<br>
CST COFINS: ${resultado.cst_cofins}<br>
% Base ICMS: ${resultado.base_icms}%<br>
% ICMS: ${resultado.icms}%<br>
% PIS: ${resultado.pis}%<br>
% COFINS: ${resultado.cofins}%
`;
}

function garantirResultado() {
    if (!ultimoResultado) {
        calcular();
    }
}

function baixarJSON() {
    garantirResultado();
    const conteudo = JSON.stringify(ultimoResultado, null, 2);
    baixarArquivo("resultado-tributario.json", conteudo, "application/json;charset=utf-8");
}

function exportarPlanilha() {
    garantirResultado();

    const linhas = [
        ["Cenario", "Contribuinte", "Destino", "CFOP", "CST ICMS", "CST PIS", "CST COFINS", "Base ICMS (%)", "ICMS (%)", "PIS (%)", "COFINS (%)"]
    ];

    Object.values(ultimoResultado.cenarios).forEach((cenario) => {
        linhas.push([
            `${cenario.contribuinte} - ${cenario.destino}`,
            cenario.contribuinte,
            cenario.destino,
            cenario.cfop,
            cenario.cst_icms,
            cenario.cst_pis,
            cenario.cst_cofins,
            cenario.base_icms,
            cenario.icms,
            cenario.pis,
            cenario.cofins
        ]);
    });

    const csv = linhas
        .map((linha) => linha.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(";"))
        .join("\n");

    baixarArquivo("resultado-tributario.csv", csv, "text/csv;charset=utf-8");
}

function baixarArquivo(nome, conteudo, tipo) {
    const blob = new Blob([conteudo], { type: tipo });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = nome;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

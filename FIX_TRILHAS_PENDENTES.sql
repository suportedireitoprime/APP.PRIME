CREATE OR REPLACE FUNCTION criar_modulo_com_aulas_draft(
    p_area_id uuid,
    p_titulo text,
    p_resumo text,
    p_ordem int,
    p_area_nome text,
    p_slug text
)
RETURNS jsonb AS $$
DECLARE
    v_modulo_id uuid;
    v_aulas_inseridas int;
BEGIN
    -- 1) Insere o Módulo com o SLUG
    INSERT INTO aprender_modulos (area_id, titulo, resumo, ordem, slug)
    VALUES (p_area_id, p_titulo, p_resumo, p_ordem, p_slug)
    RETURNING id INTO v_modulo_id;

    -- 2) Insere as aulas baseadas em resumos_juridicos com status = 'draft' e gerando slugs únicos
    WITH inseridas AS (
        INSERT INTO aprender_aulas (modulo_id, titulo, ordem, status, duracao_est_min, slug)
        SELECT 
            v_modulo_id,
            COALESCE(subtema, 'Aula ' || ordem_subtema::text),
            COALESCE(ordem_subtema, 1),
            'draft',
            15,
            -- Gera slug simples baseado no título + string aleatória para garantir unicidade
            regexp_replace(lower(COALESCE(subtema, 'aula')), '[^a-z0-9]+', '-', 'g') || '-' || substring(md5(random()::text) from 1 for 6)
        FROM resumos_juridicos
        WHERE area = p_area_nome AND tema = p_titulo
        ORDER BY ordem_subtema
        RETURNING id
    )
    SELECT count(*) INTO v_aulas_inseridas FROM inseridas;

    -- 3) Se não encontrar nenhum subtema, insere ao menos 1 aula genérica pra não deixar vazio
    IF v_aulas_inseridas = 0 THEN
        INSERT INTO aprender_aulas (modulo_id, titulo, ordem, status, duracao_est_min, slug)
        VALUES (
            v_modulo_id, 
            'Introdução a ' || p_titulo, 
            1, 
            'draft', 
            15, 
            p_slug || '-aula-1'
        );
        v_aulas_inseridas := 1;
    END IF;

    RETURN jsonb_build_object(
        'id', v_modulo_id,
        'aulas_criadas', v_aulas_inseridas
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
